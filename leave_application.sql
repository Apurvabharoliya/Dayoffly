-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 05, 2025 at 05:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dayoffly`
--

-- --------------------------------------------------------

--
-- Table structure for table `leave_application`
--

CREATE TABLE `leave_application` (
  `leave_id` int(5) NOT NULL,
  `user_id` int(5) DEFAULT NULL,
  `leave_type` varchar(30) DEFAULT NULL,
  `applied_on` datetime DEFAULT current_timestamp(),
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `leave_status` varchar(10) DEFAULT 'pending',
  `hr_remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_application`
--

INSERT INTO `leave_application` (`leave_id`, `user_id`, `leave_type`, `applied_on`, `start_date`, `end_date`, `reason`, `attachment`, `leave_status`, `hr_remarks`) VALUES
(18, 40008, 'Maternity Leave', '2025-11-03 15:05:09', '2025-11-03', '2025-11-07', 'Illniss', NULL, 'approved', NULL),
(20, 40008, 'Maternity Leave', '2025-11-04 23:10:58', '2025-11-04', '2025-11-05', 'feefefe', NULL, 'declined', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `leave_application`
--
ALTER TABLE `leave_application`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type` (`leave_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `leave_application`
--
ALTER TABLE `leave_application`
  MODIFY `leave_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
