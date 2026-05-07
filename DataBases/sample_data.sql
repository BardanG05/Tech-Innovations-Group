-- Password for all demo users: "password" (bcryptjs)
INSERT INTO public."User" (user_name, user_role, password_hash)
VALUES
    ('Amina Khan', 'Technician', '$2a$10$mqilQNDQDEWqGm6jwZUkDewvbItGEa60Rt4SQyCEbzXG7dLts7.9.'),
    ('Sam Lewis', 'Supervisor', '$2a$10$mqilQNDQDEWqGm6jwZUkDewvbItGEa60Rt4SQyCEbzXG7dLts7.9.'),
    ('Jordan Patel', 'Operations Manager', '$2a$10$mqilQNDQDEWqGm6jwZUkDewvbItGEa60Rt4SQyCEbzXG7dLts7.9.');

INSERT INTO public."ToolLog"
(tool_name, tool_id, checked_by, status_review)
VALUES
('Torque Wrench', 'TORQUE-05', 1, 'Checked Out');

INSERT INTO public."FaultReport"
(
    fault_type,
    location,
    severity,
    status,
    notes,
    marker_pattern,
    risk_score,
    weather_condition,
    asset_area,
    date_reported,
    assigned_engineer,
    days_to_resolve
)
VALUES
(
    'Signal fault',
    'Platform 2 — lamp housing',
    'High',
    'Open',
    'Intermittent flicker observed.',
    'hiro',
    8.2,
    'Rain',
    'Station Area',
    CURRENT_TIMESTAMP - interval '2 days',
    'Amina Khan',
    NULL
),
(
    'Track debris',
    'North siding',
    'Medium',
    'In progress',
    'Cleared main line; siding pending.',
    'kanji',
    5.5,
    'Fog',
    'Yard Area',
    CURRENT_TIMESTAMP - interval '5 days',
    'Sam Lewis',
    2.5
),
(
    'Door sensor',
    'Staff corridor',
    'Low',
    'Open',
    'Calibration drift.',
    'hiro',
    3.1,
    'Clear',
    'Station Area',
    CURRENT_TIMESTAMP - interval '1 day',
    'Amina Khan',
    NULL
),
(
    'Hydraulic leak',
    'Maintenance pit B',
    'High',
    'Open',
    'Seal replacement scheduled.',
    'kanji',
    9.1,
    'Rain',
    'Tunnel Section',
    CURRENT_TIMESTAMP - interval '3 hours',
    'Jordan Patel',
    NULL
),
(
    'Cable wear',
    'Bridge Section',
    'Medium',
    'Closed',
    'Replaced run.',
    NULL,
    4.2,
    'Snow',
    'Bridge Section',
    CURRENT_TIMESTAMP - interval '20 days',
    'Sam Lewis',
    4.0
);
