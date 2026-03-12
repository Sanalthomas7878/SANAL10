import os
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from functools import wraps
import math
from pathlib import Path

from dotenv import load_dotenv
from flask import (
    Flask,
    abort,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "assets" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(BASE_DIR / ".env")

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


db = SQLAlchemy()


def utcnow():
    # Keep UTC timestamps while storing naive datetime values for DB compatibility.
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="customer")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    orders = db.relationship("Order", backref="customer", lazy=True)


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    permissions = db.Column(db.String(255), nullable=False, default="all")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class ScrapCategory(db.Model):
    __tablename__ = "scrap_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    base_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    orders = db.relationship("Order", backref="category", lazy=True)


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("scrap_categories.id"), nullable=False)
    weight = db.Column(db.Numeric(10, 2), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="Pending")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    images = db.relationship("ScrapImage", backref="order", lazy=True, cascade="all, delete-orphan")


class ScrapImage(db.Model):
    __tablename__ = "scrap_images"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


def _str_to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _allowed_image(filename):
    if "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_IMAGE_EXTENSIONS


def create_app(test_config=None):
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "frontend" / "templates"),
        static_folder=str(BASE_DIR / "frontend" / "static"),
    )

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-this-in-production")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost/scrap_management",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
    app.config["GOOGLE_MAPS_API_KEY"] = os.getenv("GOOGLE_MAPS_API_KEY", "")
    app.config["AUTO_INIT_DB"] = _str_to_bool(os.getenv("AUTO_INIT_DB"), default=False)

    if test_config:
        app.config.update(test_config)

    db.init_app(app)

    def login_required(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            if not session.get("user_id"):
                flash("Please login first.", "error")
                return redirect(url_for("login"))
            return view_func(*args, **kwargs)

        return wrapper

    def role_required(*roles):
        def decorator(view_func):
            @wraps(view_func)
            def wrapper(*args, **kwargs):
                if not session.get("user_id"):
                    return redirect(url_for("login"))
                if session.get("role") not in roles:
                    flash("You do not have access to that page.", "error")
                    return redirect(url_for("index"))
                return view_func(*args, **kwargs)

            return wrapper

        return decorator

    def parse_optional_float(raw_value):
        if raw_value in (None, ""):
            return None
        try:
            parsed = float(raw_value)
        except (TypeError, ValueError):
            return None
        if not math.isfinite(parsed):
            return None
        return parsed

    def seed_defaults():
        categories = [
            {
                "name": "Aluminum Scrap",
                "description": "Cans, frames, and industrial aluminum waste.",
                "base_price": 120,
                "image_url": "https://images.unsplash.com/photo-1605600659908-0ef719419d41",
            },
            {
                "name": "Copper Scrap",
                "description": "Copper wires, tubing, and electrical scrap.",
                "base_price": 550,
                "image_url": "https://images.unsplash.com/photo-1581092446327-9f89f3f0d4d4",
            },
            {
                "name": "Metal Scrap",
                "description": "Mixed ferrous and non-ferrous metal scrap.",
                "base_price": 90,
                "image_url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b",
            },
            {
                "name": "Plastic Scrap",
                "description": "PET, HDPE, and mixed plastic recyclables.",
                "base_price": 35,
                "image_url": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9",
            },
            {
                "name": "E-Waste",
                "description": "Electronic waste including components and boards.",
                "base_price": 180,
                "image_url": "https://images.unsplash.com/photo-1581092160607-ee22731f9c46",
            },
            {
                "name": "Computer Scrap",
                "description": "CPUs, monitors, keyboards, and accessories.",
                "base_price": 140,
                "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475",
            },
            {
                "name": "Mobile Scrap",
                "description": "Damaged phones, batteries, and chargers.",
                "base_price": 165,
                "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
            },
            {
                "name": "Paper Scrap",
                "description": "Newspaper, books, cardboard, and paper bundles.",
                "base_price": 18,
                "image_url": "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9",
            },
        ]

        for item in categories:
            if not ScrapCategory.query.filter_by(name=item["name"]).first():
                db.session.add(ScrapCategory(**item))

        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@scrap.local")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@123")

        admin_user = User.query.filter_by(email=admin_email).first()
        if not admin_user:
            admin_user = User(
                full_name="System Admin",
                email=admin_email,
                phone="0000000000",
                password_hash=generate_password_hash(admin_password),
                role="admin",
                is_active=True,
            )
            db.session.add(admin_user)
            db.session.flush()

        if admin_user.role != "admin":
            admin_user.role = "admin"

        if not Admin.query.filter_by(user_id=admin_user.id).first():
            db.session.add(Admin(user_id=admin_user.id, permissions="all"))

        db.session.commit()

    def initialize_database():
        db.create_all()
        seed_defaults()

    @app.context_processor
    def inject_globals():
        return {
            "current_user_name": session.get("full_name"),
            "current_user_role": session.get("role"),
            "google_maps_api_key": app.config["GOOGLE_MAPS_API_KEY"],
        }

    @app.errorhandler(RequestEntityTooLarge)
    def file_too_large(_error):
        flash("Upload failed. Maximum image size is 10 MB.", "error")
        if session.get("role") == "customer":
            return redirect(url_for("customer_dashboard"))
        return redirect(url_for("login"))

    @app.route("/")
    def index():
        if session.get("role") == "admin":
            return redirect(url_for("admin_dashboard"))
        if session.get("role") == "customer":
            return redirect(url_for("customer_dashboard"))
        return redirect(url_for("login"))

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            full_name = request.form.get("full_name", "").strip()
            email = request.form.get("email", "").strip().lower()
            phone = request.form.get("phone", "").strip()
            address = request.form.get("address", "").strip()
            password = request.form.get("password", "")

            if not full_name or not email or not password:
                flash("Name, email, and password are required.", "error")
                return redirect(url_for("register"))

            if User.query.filter_by(email=email).first():
                flash("An account already exists with that email.", "error")
                return redirect(url_for("register"))

            user = User(
                full_name=full_name,
                email=email,
                phone=phone,
                address=address,
                password_hash=generate_password_hash(password),
                role="customer",
            )
            db.session.add(user)
            db.session.commit()
            flash("Registration successful. Please login.", "success")
            return redirect(url_for("login"))

        return render_template("register.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")

            user = User.query.filter_by(email=email, is_active=True).first()
            if not user or not check_password_hash(user.password_hash, password):
                flash("Invalid email or password.", "error")
                return redirect(url_for("login"))

            session["user_id"] = user.id
            session["full_name"] = user.full_name
            session["role"] = user.role

            if user.role == "admin":
                return redirect(url_for("admin_dashboard"))
            return redirect(url_for("customer_dashboard"))

        return render_template("login.html")

    @app.route("/logout")
    def logout():
        session.clear()
        flash("You have been logged out.", "success")
        return redirect(url_for("login"))

    @app.route("/customer/dashboard")
    @login_required
    @role_required("customer")
    def customer_dashboard():
        categories = ScrapCategory.query.filter_by(is_active=True).all()
        orders = (
            Order.query.filter_by(user_id=session["user_id"])
            .order_by(Order.created_at.desc())
            .all()
        )
        return render_template("customer_dashboard.html", categories=categories, orders=orders)

    @app.route("/customer/order/create", methods=["POST"])
    @login_required
    @role_required("customer")
    def create_order():
        category_id = request.form.get("category_id")
        weight_raw = request.form.get("weight")
        address = request.form.get("address", "").strip()
        scheduled_at = request.form.get("scheduled_at")
        notes = request.form.get("notes", "").strip()
        latitude_raw = request.form.get("latitude")
        longitude_raw = request.form.get("longitude")

        if not all([category_id, weight_raw, address, scheduled_at]):
            flash("Category, weight, address, and pickup date are required.", "error")
            return redirect(url_for("customer_dashboard"))

        try:
            category_id_int = int(category_id)
        except (TypeError, ValueError):
            flash("Please select a valid scrap category.", "error")
            return redirect(url_for("customer_dashboard"))

        category = ScrapCategory.query.filter_by(id=category_id_int, is_active=True).first()
        if not category:
            flash("Selected scrap category is unavailable.", "error")
            return redirect(url_for("customer_dashboard"))

        try:
            weight = Decimal(str(weight_raw))
            if not weight.is_finite() or weight <= 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            flash("Weight must be a positive number.", "error")
            return redirect(url_for("customer_dashboard"))

        try:
            scheduled_datetime = datetime.fromisoformat(scheduled_at)
        except ValueError:
            flash("Invalid schedule date/time format.", "error")
            return redirect(url_for("customer_dashboard"))
        if scheduled_datetime.tzinfo is not None:
            scheduled_datetime = scheduled_datetime.astimezone().replace(tzinfo=None)

        if scheduled_datetime < datetime.now():
            flash("Pickup date/time must be in the future.", "error")
            return redirect(url_for("customer_dashboard"))

        latitude = parse_optional_float(latitude_raw)
        longitude = parse_optional_float(longitude_raw)
        if (latitude_raw and latitude is None) or (longitude_raw and longitude is None):
            flash("Invalid map coordinates. Please refresh and try again.", "error")
            return redirect(url_for("customer_dashboard"))
        if latitude is not None and not (-90 <= latitude <= 90):
            flash("Latitude must be between -90 and 90.", "error")
            return redirect(url_for("customer_dashboard"))
        if longitude is not None and not (-180 <= longitude <= 180):
            flash("Longitude must be between -180 and 180.", "error")
            return redirect(url_for("customer_dashboard"))

        order = Order(
            user_id=session["user_id"],
            category_id=category_id_int,
            weight=weight,
            address=address,
            latitude=latitude,
            longitude=longitude,
            scheduled_at=scheduled_datetime,
            status="Pending",
            notes=notes,
        )
        db.session.add(order)
        db.session.flush()

        upload = request.files.get("scrap_photo")
        if upload and upload.filename:
            if not _allowed_image(upload.filename):
                db.session.rollback()
                flash("Only image files are allowed (png, jpg, jpeg, webp, gif).", "error")
                return redirect(url_for("customer_dashboard"))

            safe_name = secure_filename(upload.filename)
            timestamp = utcnow().strftime("%Y%m%d%H%M%S%f")
            filename = f"{order.id}_{timestamp}_{safe_name}"
            save_path = UPLOAD_DIR / filename
            try:
                upload.save(save_path)
            except OSError:
                db.session.rollback()
                flash("Failed to save uploaded image. Please try again.", "error")
                return redirect(url_for("customer_dashboard"))

            db.session.add(ScrapImage(order_id=order.id, image_path=filename))

        db.session.commit()
        flash("Pickup request submitted successfully.", "success")
        return redirect(url_for("customer_dashboard"))

    @app.route("/admin/dashboard")
    @login_required
    @role_required("admin")
    def admin_dashboard():
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status="Pending").count()
        accepted_orders = Order.query.filter_by(status="Accepted").count()
        completed_orders = Order.query.filter_by(status="Pickup Completed").count()

        orders = Order.query.order_by(Order.created_at.desc()).all()
        customers = User.query.filter_by(role="customer").order_by(User.created_at.desc()).all()
        categories = ScrapCategory.query.order_by(ScrapCategory.name.asc()).all()

        return render_template(
            "admin_dashboard.html",
            total_orders=total_orders,
            pending_orders=pending_orders,
            accepted_orders=accepted_orders,
            completed_orders=completed_orders,
            orders=orders,
            customers=customers,
            categories=categories,
        )

    @app.route("/admin/order/<int:order_id>/status", methods=["POST"])
    @login_required
    @role_required("admin")
    def update_order_status(order_id):
        status = request.form.get("status", "")
        allowed_statuses = {"Pending", "Accepted", "Rejected", "Pickup Completed"}
        if status not in allowed_statuses:
            flash("Invalid order status.", "error")
            return redirect(url_for("admin_dashboard"))

        order = Order.query.get_or_404(order_id)
        order.status = status
        db.session.commit()
        flash(f"Order #{order.id} updated to {status}.", "success")
        return redirect(url_for("admin_dashboard"))

    @app.route("/admin/category/create", methods=["POST"])
    @login_required
    @role_required("admin")
    def create_category():
        name = request.form.get("name", "").strip()
        description = request.form.get("description", "").strip()
        base_price_raw = request.form.get("base_price", "0")
        image_url = request.form.get("image_url", "").strip()

        if not name:
            flash("Category name is required.", "error")
            return redirect(url_for("admin_dashboard"))

        if ScrapCategory.query.filter(db.func.lower(ScrapCategory.name) == name.lower()).first():
            flash("Category already exists.", "error")
            return redirect(url_for("admin_dashboard"))

        try:
            base_price = Decimal(str(base_price_raw or "0"))
            if base_price < 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            flash("Base price must be a valid non-negative number.", "error")
            return redirect(url_for("admin_dashboard"))

        category = ScrapCategory(
            name=name,
            description=description,
            base_price=base_price,
            image_url=image_url or None,
            is_active=True,
        )
        db.session.add(category)
        db.session.commit()
        flash("Category created successfully.", "success")
        return redirect(url_for("admin_dashboard"))

    @app.route("/uploads/<path:filename>")
    @login_required
    def uploaded_file(filename):
        image = ScrapImage.query.filter_by(image_path=filename).first_or_404()
        if session.get("role") != "admin" and image.order.user_id != session.get("user_id"):
            abort(403)
        return send_from_directory(UPLOAD_DIR, image.image_path)

    @app.route("/api/orders/<int:order_id>")
    @login_required
    def api_order(order_id):
        order = Order.query.get_or_404(order_id)
        if session.get("role") != "admin" and order.user_id != session.get("user_id"):
            return jsonify({"error": "unauthorized"}), 403

        return jsonify(
            {
                "id": order.id,
                "status": order.status,
                "category": order.category.name,
                "weight": float(order.weight),
                "scheduled_at": order.scheduled_at.isoformat(),
                "latitude": order.latitude,
                "longitude": order.longitude,
                "address": order.address,
            }
        )

    @app.cli.command("init-db")
    def init_db_command():
        initialize_database()
        print("Database initialized with default data.")

    if app.config.get("AUTO_INIT_DB"):
        with app.app_context():
            initialize_database()

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
