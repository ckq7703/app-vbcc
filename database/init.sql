USE certificate_db;

INSERT INTO Users (email, password, role) VALUES
('admin@example.com', '$2b$10$VmcNeJW6MsCQG3nFqnxnGOkfx7GssEd3nUxlB1ZcVKQgTeZP12EiS', 'admin'), -- Hash password bằng bcrypt
('student@example.com', '$2b$10$VmcNeJW6MsCQG3nFqnxnGOkfx7GssEd3nUxlB1ZcVKQgTeZP12EiS', 'student'),
('verifier@example.com', '$2b$10$VmcNeJW6MsCQG3nFqnxnGOkfx7GssEd3nUxlB1ZcVKQgTeZP12EiS', 'verifier');

INSERT INTO Students (name, studentId, email, dob, course) VALUES
('Nguyen Van A', 'SV001', 'student@example.com', '2000-01-01', 'CNTT');

INSERT INTO Certificates (studentId, issueDate, status, transactionHash) VALUES
('SV001', 1625097600, true, '0x1234567890abcdef');