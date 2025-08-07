-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 07, 2025 at 09:14 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `certificate_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `issueDate` bigint(20) NOT NULL,
  `status` tinyint(1) DEFAULT 0,
  `transactionHash` varchar(66) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `studentId`, `issueDate`, `status`, `transactionHash`) VALUES
(1, 'SV001', 1625097600, 1, '0x1234567890abcdef');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `dob` date DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `studentId`, `email`, `dob`, `course`) VALUES
(1, 'Nguyen Van A', 'SV001', 'student@example.com', '2000-01-01', 'CNTT');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_certificates`
--

CREATE TABLE `tbl_certificates` (
  `id` int(11) NOT NULL,
  `studentAddress` varchar(42) NOT NULL,
  `studentName` varchar(255) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `university` varchar(255) NOT NULL,
  `issueDate` bigint(20) NOT NULL,
  `courseName` varchar(255) DEFAULT NULL,
  `instructor` varchar(255) DEFAULT NULL,
  `ipfsHash` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `certpath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_certificates`
--

INSERT INTO `tbl_certificates` (`id`, `studentAddress`, `studentName`, `studentId`, `university`, `issueDate`, `courseName`, `instructor`, `ipfsHash`, `createdAt`, `certpath`) VALUES
(1, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'Lê Văn Luân14', '2310060022', 'HUTECH', 1754459925, 'ATTT', 'Nguyễn Thị Thu', 'QmdrMDwLKcu5wznRFhSuLJEj5HQAE5SH1CWVKr7EGEmd1s', '2025-08-06 07:40:21', NULL),
(2, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC1', '2310060022', 'HUTECH', 1754467187, 'ATTT', 'Nguyễn Thị Thu', 'Qmc4N2fvA8wxmAD4fEkGVckYd7GBPFCyJjeavZecA6J3hx', '2025-08-06 09:25:07', NULL),
(3, '0xd01C8929d5351233FbeB37ED709732517B486672', 'QUOC2', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmfZ8qwoxs8JqsBKaQHAxjB1rijxbPD28UD4MZkNHR6YC8', '2025-08-06 09:58:39', NULL),
(4, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC3', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmRAru6ZzStoowUcafZfSwxRbxvmyco4EzvS4tPTJtS6jD', '2025-08-06 10:09:31', NULL),
(5, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC4', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmNwSbXKvEo81VQ4uXXSVV7a5ha8oJg8ffWiTTZjj9WxBt', '2025-08-06 10:13:57', NULL),
(6, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC4', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmZMFPv6gLCdGLzkUuUZK3R3oVT2CD3YATvcLp6MK14ckp', '2025-08-06 10:16:13', NULL),
(7, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC4', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmUThYy2XBwS4kG1PDro6QNJ2BBEFcsaozds1cBTyov5wG', '2025-08-06 10:29:23', NULL),
(8, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC5', '123456', 'HCM', 1754474290, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmbfNgd3cMkrm2h8W8neBMQ6MaQ5kVYMSaMNri74j8J2Ek', '2025-08-06 10:45:39', NULL),
(9, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC6', '123456', 'HCM', 1754538155, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmbCN4X8ckJfA7ax3SYgPNEgNZeS1JNoRq4qfvuGhYUsQs', '2025-08-07 03:43:12', NULL),
(10, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC7', '123456', 'HCM', 1754538155, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmRVEtBGMbe2GQGPEVw16SkFrTntj9yc3vLMsd9cng1Sk7', '2025-08-07 04:48:44', NULL),
(11, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC8', '123456', 'HCM', 1754542888, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmZJ1b8y5s1gjSndGdZqTG8ns5K9sMzAcoDgAj1gjUWj9k', '2025-08-07 05:01:33', NULL),
(12, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC9', '123456', 'HCM', 1754542888, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmQ6avyUNTsbCbaaL3BvFwWEUixWrR3MdZrC2Bjy88aXfJ', '2025-08-07 05:14:21', NULL),
(13, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'QUOC10', '123456', 'HCM', 1754542888, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmSZzGPzxJe4iNd3B9NkLuiF2HYF3YrMDcLaEfSkXJ2mBc', '2025-08-07 05:20:56', NULL),
(14, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'Q1', '123456', 'HCM', 1754545595, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'Qmdz6D7mdiVzYgN3aVmJhfi1vvHqDoweDq74845tzv5Tst', '2025-08-07 05:46:40', '/upload/cert/Qmdz6D7mdiVzYgN3aVmJhfi1vvHqDoweDq74845tzv5Tst-1754545600396-247965483.pdf'),
(15, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'Q2', '123456', 'HCM', 1754546292, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmWPjiNwvxNEfN12cNhV4hAk7SvnEr8dNnmvufmSiq2uF8', '2025-08-07 05:58:17', '/upload/cert/QmWPjiNwvxNEfN12cNhV4hAk7SvnEr8dNnmvufmSiq2uF8.pdf'),
(16, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'Q3', '123456', 'HCM', 1754546292, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmcyZKww4TWyPPkZAjEZa8Xab4fB6fdHMiww6fc8t2tKSr', '2025-08-07 06:30:05', '/upload/cert/QmcyZKww4TWyPPkZAjEZa8Xab4fB6fdHMiww6fc8t2tKSr.pdf'),
(17, '0x86233c8fD329d3Ddfa558F2Dc4a0cFc8590025D3', 'Q4', '123456', 'HCM', 1754550225, 'LẬP TRÌNH BLOCKCHAIN', 'NGUYỄN VĂN A', 'QmTzZyUZDbn5VUDdgSuCY3hgsFzgGe9WUst4FdzxULGp6R', '2025-08-07 07:03:51', '/upload/cert/QmTzZyUZDbn5VUDdgSuCY3hgsFzgGe9WUst4FdzxULGp6R.pdf');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','student','verifier') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `createdAt`) VALUES
(4, 'admin@example.com', '$2b$10$3X8T7aFh6jBYkKMyDOOs2uND0QNAqsCUJp9bQ3HSP.9bhOxhHFAle', 'admin', '2025-07-13 11:38:26'),
(5, 'student@example.com', '$2b$10$9aRz0BxXJX8AIBS6OvKkHeq2FJ7rFHPzz8rD.FW.XuRR1ZgdnzYkS', 'student', '2025-07-13 14:29:47'),
(6, 'verifier@example.com', '$2b$10$2UR2RQmNYz.5r8fdrHXnGeRYEhAPxyDk0q/3a8gIfHmxH21jej.ze', 'verifier', '2025-07-13 14:30:18');

-- --------------------------------------------------------

--
-- Table structure for table `verificationlogs`
--

CREATE TABLE `verificationlogs` (
  `id` int(11) NOT NULL,
  `certificateId` int(11) NOT NULL,
  `verifierId` varchar(255) NOT NULL,
  `result` tinyint(1) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studentId` (`studentId`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `studentId` (`studentId`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbl_certificates`
--
ALTER TABLE `tbl_certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_studentId` (`studentId`),
  ADD KEY `idx_ipfsHash` (`ipfsHash`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `verificationlogs`
--
ALTER TABLE `verificationlogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `certificateId` (`certificateId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_certificates`
--
ALTER TABLE `tbl_certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `verificationlogs`
--
ALTER TABLE `verificationlogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`);

--
-- Constraints for table `verificationlogs`
--
ALTER TABLE `verificationlogs`
  ADD CONSTRAINT `verificationlogs_ibfk_1` FOREIGN KEY (`certificateId`) REFERENCES `certificates` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
