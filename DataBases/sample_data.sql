INSERT INTO public."User" (user_name, user_role)
VALUES
('Amina Khan', 'Technician'),
('Sam Lewis', 'Supervisor'),
('Jordan Patel', 'Operations Manager');

INSERT INTO public."ToolLog"
(tool_name, tool_id, checked_by, status_review)
VALUES
('Torque Wrench', 'TORQUE-05', 1, 'Checked Out');

INSERT INTO public."FaultReport"
(fault_type, location, severity, status, notes, marker_pattern)
VALUES
('Signal fault', 'Platform 2 — lamp housing', 'High', 'Open', 'Intermittent flicker observed.', 'hiro'),
('Track debris', 'North siding', 'Medium', 'In progress', 'Cleared main line; siding pending.', 'kanji');