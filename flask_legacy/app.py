import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_secret_key'
DATABASE = 'database.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    cursor = db.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL
        )
    ''')
    
    # Create Bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            item_or_service TEXT NOT NULL,
            address TEXT NOT NULL,
            pincode TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT DEFAULT 'Pending'
        )
    ''')
    
    db.commit()
    db.close()

# Initialize database if it doesn't exist
if not os.path.exists(DATABASE):
    init_db()
    print("Initialized database.db with essential tables.")
else:
    # Always ensure tables exist, just in case.
    init_db()

@app.route('/')
def index():
    categories = [
        {'name': 'Plastic', 'icon': '🥤'},
        {'name': 'Metal', 'icon': '⚙️'},
        {'name': 'Aluminum', 'icon': '🥫'},
        {'name': 'E-waste', 'icon': '💻'}
    ]
    return render_template('index.html', categories=categories)

@app.route('/services')
def services():
    services_list = [
        {'name': 'Scrap Pickup', 'desc': 'Doorstep scrap collection.'},
        {'name': 'Home Cleaning', 'desc': 'Professional home cleaning.'},
        {'name': 'Tank Cleaning', 'desc': 'Water tank sanitization.'},
        {'name': 'Plumbing', 'desc': 'Pipes and leak repairs.'},
        {'name': 'Electrician', 'desc': 'Wiring and electrical fixes.'}
    ]
    return render_template('services.html', services=services_list)

@app.route('/booking', methods=['GET', 'POST'])
def booking():
    if request.method == 'POST':
        booking_type = request.form.get('type')  # 'scrap' or 'service'
        item = request.form.get('item')
        address = request.form.get('address')
        pincode = request.form.get('pincode')
        date = request.form.get('date')

        allowed_pincodes = ['576101', '576102']
        if pincode not in allowed_pincodes:
            flash('Sorry, we do not service this PIN code yet.', 'error')
            return redirect(url_for('booking'))

        db = get_db()
        db.execute(
            'INSERT INTO bookings (type, item_or_service, address, pincode, date) VALUES (?, ?, ?, ?, ?)',
            (booking_type, item, address, pincode, date)
        )
        db.commit()
        db.close()
        flash('Booking successful!', 'success')
        return redirect(url_for('booking'))

    return render_template('booking.html')

if __name__ == '__main__':
    # IMPORTANT: Output instructions explicitly state http://127.0.0.1:5000
    app.run(debug=True, host='127.0.0.1', port=5000)
