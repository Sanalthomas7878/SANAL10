const validateScheduledAt = (scheduledAt) => {
  const parsedScheduledAt = new Date(scheduledAt);

  if (Number.isNaN(parsedScheduledAt.getTime())) {
    return { isValid: false, message: 'Please choose a valid pickup date and time.' };
  }

  if (parsedScheduledAt.getTime() < Date.now()) {
    return { isValid: false, message: 'Pickup date and time cannot be in the past.' };
  }

  return { isValid: true, parsedScheduledAt };
};

module.exports = { validateScheduledAt };
