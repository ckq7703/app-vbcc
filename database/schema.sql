CREATE DATABASE IF NOT EXISTS certificate_db;

USE certificate_db;

CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student', 'verifier') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  studentId VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  dob DATE,
  course VARCHAR(100)
);

CREATE TABLE Certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(50) NOT NULL,
  issueDate BIGINT NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  transactionHash VARCHAR(66),
  FOREIGN KEY (studentId) REFERENCES Students(studentId)
);

CREATE TABLE VerificationLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificateId INT NOT NULL,
  verifierId VARCHAR(255) NOT NULL,
  result BOOLEAN NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (certificateId) REFERENCES Certificates(id)
);