-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 03, 2025 at 04:59 PM
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
-- Database: `dayoffly`
--

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `department_id` int(5) NOT NULL,
  `department_name` enum('Human Resources','Finance','IT','Sales','Marketing','Research & Development') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`department_id`, `department_name`) VALUES
(1, 'Human Resources'),
(2, 'Finance'),
(3, 'IT'),
(4, 'Sales'),
(5, 'Marketing'),
(6, 'Research & Development');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_contacts`
--

CREATE TABLE `emergency_contacts` (
  `contact_id` int(5) NOT NULL,
  `user_id` int(5) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `relationship` varchar(50) NOT NULL,
  `phone_number` varchar(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_contacts`
--

INSERT INTO `emergency_contacts` (`contact_id`, `user_id`, `contact_name`, `relationship`, `phone_number`) VALUES
(3, 0, 'Michael Chen', 'Spouse', '(555) 987-6543'),
(4, 0, 'Sarah Johnson', 'Friend', '(555) 456-7890');

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
  `leave_status` varchar(10) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_application`
--

INSERT INTO `leave_application` (`leave_id`, `user_id`, `leave_type`, `applied_on`, `start_date`, `end_date`, `reason`, `attachment`, `leave_status`) VALUES
(20, 30001, 'Sick Leave', '2025-09-27 09:15:00', '2025-10-01', '2025-10-02', 'Medical appointment and recovery', 'medical_certificate.pdf', 'declined'),
(21, 30003, 'Vacation', '2025-09-28 14:30:00', '2025-11-15', '2025-11-22', 'Family vacation to Hawaii', 'flight_tickets.pdf', 'declined'),
(22, 30002, 'Casual Leave', '2025-09-29 10:00:00', '2025-10-10', '2025-10-10', 'Personal commitment', NULL, 'approved'),
(23, 30001, 'Vacation', '2025-09-29 16:45:00', '2025-12-20', '2025-12-31', 'Year-end holidays with family', NULL, 'declined'),
(24, 30003, 'Sick Leave', '2025-09-30 08:20:00', '2025-10-05', '2025-10-07', 'Flu and fever recovery', 'doctor_note.jpg', 'approved'),
(25, 30002, 'Vacation', '2025-09-30 11:30:00', '2026-01-10', '2026-01-20', 'Winter vacation plans', 'hotel_booking.pdf', 'rejected'),
(26, 30001, 'Maternity Leave', '2025-10-01 13:00:00', '2026-03-01', '2026-06-01', 'Maternity leave for childbirth', 'pregnancy_confirmation.pdf', 'approved'),
(27, 30003, 'Paternity Leave', '2025-10-02 09:45:00', '2026-02-15', '2026-03-01', 'Paternity leave for newborn child', 'birth_certificate.pdf', 'declined'),
(28, 30004, 'Sick Leave', '2025-10-03 19:31:13', '2024-01-15', '2024-01-16', 'Flu', NULL, 'approved'),
(29, 30004, 'Vacation', '2025-10-03 19:31:13', '2024-03-10', '2024-03-15', 'Family vacation', NULL, 'approved'),
(30, 30005, 'Casual Leave', '2025-10-03 19:31:13', '2024-02-20', '2024-02-20', 'Personal work', NULL, 'approved'),
(31, 30006, 'Sick Leave', '2025-10-03 19:31:13', '2024-04-05', '2024-04-07', 'Medical appointment', NULL, 'approved'),
(32, 30007, 'Vacation', '2025-10-03 19:31:13', '2024-06-12', '2024-06-19', 'Summer break', NULL, 'approved'),
(33, 30008, 'Casual Leave', '2025-10-03 19:31:13', '2024-05-01', '2024-05-01', 'Family event', NULL, 'approved'),
(34, 30009, 'Sick Leave', '2025-10-03 19:31:13', '2024-07-08', '2024-07-10', 'Medical leave', NULL, 'approved'),
(35, 30010, 'Casual Leave', '2025-10-03 19:31:13', '2024-08-22', '2024-08-23', 'Personal reasons', NULL, 'approved');

-- --------------------------------------------------------

--
-- Table structure for table `leave_balance`
--

CREATE TABLE `leave_balance` (
  `user_id` int(5) DEFAULT NULL,
  `leave_type` varchar(30) DEFAULT NULL,
  `total_leaves` int(3) NOT NULL,
  `used_leaves` int(3) DEFAULT 0,
  `remaining_leaves` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_balance`
--

INSERT INTO `leave_balance` (`user_id`, `leave_type`, `total_leaves`, `used_leaves`, `remaining_leaves`) VALUES
(30002, 'Sick Leave', 10, 8, 1),
(30004, NULL, 20, 0, 20),
(30004, 'Sick Leave', 10, 2, 8),
(30004, 'Vacation', 15, 6, 9),
(30005, 'Casual Leave', 12, 1, 11),
(30006, 'Sick Leave', 10, 3, 7),
(30007, 'Vacation', 15, 8, 7),
(30008, 'Casual Leave', 12, 1, 11),
(30009, 'Sick Leave', 10, 3, 7),
(30010, 'Casual Leave', 12, 2, 10),
(30011, 'Sick Leave', 10, 0, 10),
(30011, 'Vacation', 15, 0, 15),
(30011, 'Casual Leave', 12, 0, 12);

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `leave_type` varchar(30) NOT NULL,
  `rules` text DEFAULT NULL,
  `carry_forward_allowed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`leave_type`, `rules`, `carry_forward_allowed`) VALUES
('Casual Leave', 'Personal leave', 1),
('Maternity Leave', 'Maternity leave', 0),
('Paternity Leave', 'Paternity leave', 0),
('Sick Leave', 'Paid sick leave', 1),
('Vacation', 'Paid vacation', 0);

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `role_id` int(5) NOT NULL,
  `role_name` enum('Manager','HR','Senior','Junior','Intern') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`role_id`, `role_name`) VALUES
(1, 'Manager'),
(2, 'HR'),
(3, 'Senior'),
(4, 'Junior'),
(5, 'Intern');

-- --------------------------------------------------------

--
-- Table structure for table `users_master`
--

CREATE TABLE `users_master` (
  `user_id` int(5) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(20) NOT NULL,
  `department_id` int(5) DEFAULT NULL,
  `role_id` int(5) DEFAULT NULL,
  `designation` varchar(20) NOT NULL,
  `contact_number` varchar(16) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `approver_id` int(5) NOT NULL,
  `personal_email` varchar(255) DEFAULT NULL,
  `mobile_phone` varchar(16) DEFAULT NULL,
  `work_phone` varchar(20) DEFAULT NULL,
  `home_address` text DEFAULT NULL,
  `preferred_name` varchar(50) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `pronouns` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_master`
--

INSERT INTO `users_master` (`user_id`, `user_name`, `email`, `password`, `department_id`, `role_id`, `designation`, `contact_number`, `is_active`, `approver_id`, `personal_email`, `mobile_phone`, `work_phone`, `home_address`, `preferred_name`, `date_of_birth`, `gender`, `nationality`, `pronouns`) VALUES
(2, 'HR Manager', 'hr@company.com', 'hrpassword', 1, 2, 'HR Manager', '0987654321', 1, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30001, 'Brian', 'a@gmailcom', '124', 1, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30002, 'Jane Austen', 'jane@gmail.com', 'jane6101', 3, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30003, 'Meet', 'm@gmail.com', '0002', 3, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30004, 'het patel', 'het@gmail.com', 'Pass@30004', 3, 2, 'It', '8866378552 ', 1, 2, NULL, NULL, NULL, NULL, NULL, '2025-09-13', 'Male', NULL, NULL),
(30005, 'Sarah Johnson', 'sarah.johnson@company.com', 'password123', 1, 2, 'HR Specialist', '555-0102', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30006, 'Mike Chen', 'mike.chen@company.com', 'password123', 4, 3, 'Sales Executive', '555-0103', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30007, 'Emily Davis', 'emily.davis@company.com', 'password123', 5, 4, 'Marketing Coordinato', '555-0104', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30008, 'David Wilson', 'david.wilson@company.com', 'password123', 2, 3, 'Financial Analyst', '555-0105', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30009, 'Lisa Brown', 'lisa.brown@company.com', 'password123', 6, 3, 'Research Scientist', '555-0106', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30010, 'Robert Taylor', 'robert.taylor@company.com', 'password123', 3, 4, 'IT Support', '555-0107', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30011, 'Heer', 'soni@gmail.com', 'heer30011', 1, 4, 'senior hr', '1234567899', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD PRIMARY KEY (`contact_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `leave_application`
--
ALTER TABLE `leave_application`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type` (`leave_type`);

--
-- Indexes for table `leave_balance`
--
ALTER TABLE `leave_balance`
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type` (`leave_type`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`leave_type`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `users_master`
--
ALTER TABLE `users_master`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  MODIFY `contact_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leave_application`
--
ALTER TABLE `leave_application`
  MODIFY `leave_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD CONSTRAINT `emergency_contacts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_master` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_application`
--
ALTER TABLE `leave_application`
  ADD CONSTRAINT `leave_application_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_master` (`user_id`),
  ADD CONSTRAINT `leave_application_ibfk_2` FOREIGN KEY (`leave_type`) REFERENCES `leave_types` (`leave_type`);

--
-- Constraints for table `leave_balance`
--
ALTER TABLE `leave_balance`
  ADD CONSTRAINT `leave_balance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_master` (`user_id`),
  ADD CONSTRAINT `leave_balance_ibfk_2` FOREIGN KEY (`leave_type`) REFERENCES `leave_types` (`leave_type`);

--
-- Constraints for table `users_master`
--
ALTER TABLE `users_master`
  ADD CONSTRAINT `users_master_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  ADD CONSTRAINT `users_master_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`),
  ADD CONSTRAINT `users_master_ibfk_3` FOREIGN KEY (`approver_id`) REFERENCES `users_master` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
