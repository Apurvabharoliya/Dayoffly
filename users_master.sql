-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2025 at 09:16 AM
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
  `pronouns` varchar(20) DEFAULT NULL,
  `user_role` enum('HR','Employee') NOT NULL DEFAULT 'Employee'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_master`
--

INSERT INTO `users_master` (`user_id`, `user_name`, `email`, `password`, `department_id`, `role_id`, `designation`, `contact_number`, `is_active`, `approver_id`, `personal_email`, `mobile_phone`, `work_phone`, `home_address`, `preferred_name`, `date_of_birth`, `gender`, `nationality`, `pronouns`, `user_role`) VALUES
(2, 'HR Manager', 'hr@company.com', 'hrpassword', 1, 2, 'HR Manager', '0987654321', 1, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'HR'),
(30001, 'Brian', 'a@gmailcom', '124', 1, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30002, 'Jane Austen', 'jane@gmail.com', 'jane6101', 3, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30003, 'Meet', 'm@gmail.com', '0002', 3, 3, 'Web Developer', '9087240905', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30004, 'het patel', 'het@gmail.com', 'Pass@30004', 3, 2, 'It', '8866378552 ', 1, 2, NULL, NULL, NULL, NULL, NULL, '2025-09-13', 'Male', NULL, NULL, 'HR'),
(30005, 'Sarah Johnson', 'sarah.johnson@company.com', 'password123', 1, 2, 'HR Specialist', '555-0102', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30006, 'Mike Chen', 'mike.chen@company.com', 'Krishna', 4, 3, 'Sales Executive', '555-0103', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30007, 'Emily Davis', 'emily.davis@company.com', 'password123', 5, 4, 'Marketing Coordinato', '555-0104', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30008, 'David Wilson', 'david.wilson@company.com', 'password123', 2, 3, 'Financial Analyst', '555-0105', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30009, 'Lisa Brown', 'lisa.brown@company.com', 'password123', 6, 3, 'Research Scientist', '555-0106', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30010, 'Robert Taylor', 'robert.taylor@company.com', 'password123', 3, 4, 'IT Support', '555-0107', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30011, 'Heer', 'soni@gmail.com', 'heer30011', 1, 4, 'senior hr', '1234567899', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(30013, 'Zill', 'Suryawala@gmail.com', 'zill30013', 3, 4, 'Senior', '8866378552', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'HR');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users_master`
--
ALTER TABLE `users_master`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `approver_id` (`approver_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
