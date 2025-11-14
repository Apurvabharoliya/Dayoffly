-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 04:55 PM
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
(1, 40001, 'Mary Smith', 'Spouse', '555-2001'),
(2, 40001, 'Robert Smith', 'Father', '555-2002'),
(3, 40002, 'James Wilson', 'Spouse', '555-2003'),
(4, 40003, 'Jennifer Brown', 'Sister', '555-2004'),
(5, 40004, 'Kevin Johnson', 'Husband', '555-2005'),
(6, 40005, 'Anna Lee', 'Mother', '555-2006'),
(7, 40006, 'Carlos Garcia', 'Brother', '555-2007'),
(8, 40007, 'Linda Chen', 'Wife', '555-2008'),
(9, 40008, 'Paul Taylor', 'Father', '555-2009'),
(10, 40009, 'Susan Miller', 'Mother', '555-2010'),
(11, 40010, 'Richard Davis', 'Father', '555-2011'),
(12, 40011, 'Patricia Wilson', 'Wife', '555-2012');

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `holiday_id` int(11) NOT NULL,
  `holiday_name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `holidays`
--

INSERT INTO `holidays` (`holiday_id`, `holiday_name`, `holiday_date`) VALUES
(1, 'Republic Day', '2024-01-26'),
(2, 'Holi', '2024-03-25'),
(3, 'Independence Day', '2024-08-15'),
(4, 'Diwali', '2024-11-12');

-- --------------------------------------------------------

--
-- Table structure for table `leave_accruals`
--

CREATE TABLE `leave_accruals` (
  `accrual_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `accrual_month` int(11) NOT NULL,
  `accrual_year` int(11) NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `accrued_days` decimal(5,2) NOT NULL,
  `used_days` decimal(5,2) DEFAULT 0.00,
  `remaining_days` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_application`
--

CREATE TABLE `leave_application` (
  `leave_id` int(5) NOT NULL,
  `user_id` int(5) DEFAULT NULL,
  `leave_type` varchar(30) DEFAULT NULL,
  `leave_category` enum('paid','casual','sick') DEFAULT 'paid',
  `applied_on` datetime DEFAULT current_timestamp(),
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `leave_days` int(11) DEFAULT NULL,
  `reason` text NOT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `leave_status` varchar(10) DEFAULT 'pending',
  `hr_remarks` text DEFAULT NULL,
  `approved_by_hr` tinyint(1) DEFAULT 0,
  `approver_id` int(11) DEFAULT NULL,
  `employee_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_application`
--

INSERT INTO `leave_application` (`leave_id`, `user_id`, `leave_type`, `leave_category`, `applied_on`, `start_date`, `end_date`, `leave_days`, `reason`, `contact_info`, `attachment`, `document_path`, `leave_status`, `hr_remarks`, `approved_by_hr`, `approver_id`, `employee_type`) VALUES
(18, 40008, 'Maternity Leave', 'paid', '2025-11-03 15:05:09', '2025-11-03', '2025-11-07', NULL, 'Illniss', NULL, NULL, NULL, 'approved', NULL, 0, NULL, 'Full-time'),
(20, 40008, 'Maternity Leave', 'paid', '2025-11-04 23:10:58', '2025-11-04', '2025-11-05', NULL, 'feefefe', NULL, NULL, NULL, 'declined', NULL, 0, NULL, 'Full-time'),
(21, 40007, 'Maternity Leave', 'paid', '2025-11-04 23:10:58', '2025-11-04', '2025-11-05', NULL, 'Seee all', NULL, NULL, NULL, 'approved', NULL, 0, NULL, 'Full-time'),
(22, 40006, 'Paternity Leave', 'paid', '2025-11-05 11:19:04', '2025-11-05', '2025-11-06', NULL, 'having to goo', NULL, NULL, NULL, 'pending', NULL, 0, NULL, 'Full-time'),
(23, 40006, 'Maternity Leave', 'paid', '2025-11-05 11:20:08', '2025-11-05', '2025-11-06', NULL, 'dwdw', NULL, NULL, NULL, 'approved', NULL, 0, NULL, 'Full-time'),
(24, 40002, 'Casual Leave', 'paid', '2025-11-05 11:27:01', '2025-01-15', '2025-01-16', NULL, 'Family emergency', NULL, NULL, NULL, 'pending', NULL, 0, NULL, 'Full-time'),
(25, 40002, 'Casual Leave', 'paid', '2025-11-05 11:27:10', '2025-01-15', '2025-01-16', NULL, 'Family emergency', NULL, NULL, NULL, 'pending', NULL, 0, NULL, 'Full-time'),
(26, 40006, 'Vacation', 'paid', '2025-11-05 11:32:52', '2025-11-05', '2025-11-06', NULL, 'wefew', NULL, NULL, NULL, 'approved', NULL, 0, NULL, 'Full-time'),
(28, 40008, 'Paternity Leave', 'paid', '2025-11-05 13:25:15', '2025-11-05', '2025-11-06', NULL, 'hhh', NULL, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEASABIAAD/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0', NULL, 'pending', NULL, 0, NULL, 'Full-time');

-- --------------------------------------------------------

--
-- Table structure for table `leave_balance`
--

CREATE TABLE `leave_balance` (
  `balance_id` int(11) NOT NULL,
  `user_id` int(5) DEFAULT NULL,
  `leave_type` varchar(30) DEFAULT NULL,
  `total_leaves` decimal(5,2) NOT NULL DEFAULT 0.00,
  `used_leaves` decimal(5,2) NOT NULL DEFAULT 0.00,
  `remaining_leaves` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_paid` tinyint(1) DEFAULT 0,
  `leave_year` year(4) DEFAULT year(curdate()),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_balance`
--

INSERT INTO `leave_balance` (`balance_id`, `user_id`, `leave_type`, `total_leaves`, `used_leaves`, `remaining_leaves`, `is_paid`, `leave_year`, `updated_at`) VALUES
(1, 40001, 'Sick Leave', 7.00, 2.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(2, 40001, 'Vacation', 5.00, 1.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(3, 40001, 'Casual Leave', 3.00, 0.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(4, 40002, 'Sick Leave', 6.00, 3.00, 1.00, 0, '2025', '2025-11-11 13:29:23'),
(5, 40002, 'Vacation', 6.00, 2.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(6, 40002, 'Casual Leave', 3.00, 1.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(7, 40003, 'Sick Leave', 8.00, 0.00, 8.00, 0, '2025', '2025-11-11 13:29:23'),
(8, 40003, 'Vacation', 4.00, 3.00, 1.00, 0, '2025', '2025-11-11 13:29:23'),
(9, 40003, 'Casual Leave', 3.00, 0.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(10, 40004, 'Sick Leave', 5.00, 2.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(11, 40004, 'Vacation', 7.00, 1.00, 6.00, 0, '2025', '2025-11-11 13:29:23'),
(12, 40004, 'Casual Leave', 3.00, 1.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(13, 40005, 'Sick Leave', 6.00, 1.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(14, 40005, 'Vacation', 5.00, 0.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(15, 40005, 'Casual Leave', 4.00, 2.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(16, 40006, 'Sick Leave', 7.00, 3.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(17, 40006, 'Vacation', 5.00, 4.00, 1.00, 0, '2025', '2025-11-11 13:29:23'),
(18, 40006, 'Casual Leave', 3.00, 0.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(19, 40007, 'Sick Leave', 5.00, 0.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(20, 40007, 'Vacation', 6.00, 4.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(21, 40007, 'Casual Leave', 4.00, 1.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(22, 40008, 'Sick Leave', 6.00, 2.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(23, 40008, 'Vacation', 5.00, 1.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(24, 40008, 'Casual Leave', 4.00, 0.00, 4.00, 0, '2025', '2025-11-11 13:29:23'),
(25, 40009, 'Sick Leave', 7.00, 1.00, 6.00, 0, '2025', '2025-11-11 13:29:23'),
(26, 40009, 'Vacation', 4.00, 2.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(27, 40009, 'Casual Leave', 4.00, 1.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(28, 40010, 'Sick Leave', 5.00, 0.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(29, 40010, 'Vacation', 6.00, 3.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(30, 40010, 'Casual Leave', 4.00, 2.00, 2.00, 0, '2025', '2025-11-11 13:29:23'),
(31, 40011, 'Sick Leave', 6.00, 1.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(32, 40011, 'Vacation', 5.00, 0.00, 5.00, 0, '2025', '2025-11-11 13:29:23'),
(33, 40011, 'Casual Leave', 4.00, 1.00, 3.00, 0, '2025', '2025-11-11 13:29:23'),
(34, 40012, 'Sick Leave', 10.00, 0.00, 10.00, 0, '2025', '2025-11-11 13:29:23'),
(35, 40012, 'Vacation', 15.00, 0.00, 15.00, 0, '2025', '2025-11-11 13:29:23'),
(36, 40012, 'Casual Leave', 12.00, 0.00, 12.00, 0, '2025', '2025-11-11 13:29:23'),
(37, 40013, 'Sick Leave', 10.00, 0.00, 10.00, 0, '2025', '2025-11-11 13:29:23'),
(38, 40013, 'Vacation', 15.00, 0.00, 15.00, 0, '2025', '2025-11-11 13:29:23'),
(39, 40013, 'Casual Leave', 12.00, 0.00, 12.00, 0, '2025', '2025-11-11 13:29:23'),
(40, 40014, 'Sick Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(41, 40014, 'Vacation', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(42, 40014, 'Casual Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(43, 40014, 'Maternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(44, 40014, 'Paternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(45, 40015, 'Sick Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(46, 40015, 'Vacation', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(47, 40015, 'Casual Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(48, 40015, 'Maternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(49, 40015, 'Paternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(50, 40016, 'Sick Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(51, 40016, 'Vacation', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(52, 40016, 'Casual Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(53, 40016, 'Maternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23'),
(54, 40016, 'Paternity Leave', 0.00, 0.00, 0.00, 0, '2025', '2025-11-11 13:29:23');

-- --------------------------------------------------------

--
-- Table structure for table `leave_policies`
--

CREATE TABLE `leave_policies` (
  `id` int(11) NOT NULL,
  `employee_type` varchar(50) NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `annual_allocation` int(11) NOT NULL,
  `monthly_accrual` decimal(5,2) NOT NULL,
  `requires_document` tinyint(1) DEFAULT 0,
  `max_days_per_request` int(11) DEFAULT 10,
  `carry_over_limits` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_policies`
--

INSERT INTO `leave_policies` (`id`, `employee_type`, `leave_type`, `annual_allocation`, `monthly_accrual`, `requires_document`, `max_days_per_request`, `carry_over_limits`, `created_at`) VALUES
(1, 'Intern', 'paid', 8, 0.67, 0, 3, 0, '2025-11-11 15:13:00'),
(2, 'Intern', 'casual', 4, 0.33, 0, 2, 0, '2025-11-11 15:13:00'),
(3, 'Full-time', 'paid', 18, 1.50, 0, 10, 5, '2025-11-11 15:13:00'),
(4, 'Full-time', 'casual', 12, 1.00, 0, 5, 2, '2025-11-11 15:13:00'),
(5, 'Full-time', 'sick', 7, 0.58, 1, 3, 0, '2025-11-11 15:13:00'),
(6, 'Full-time', 'emergency', 5, 0.42, 0, 2, 0, '2025-11-11 15:13:00'),
(7, 'Full-time', 'maternity', 84, 7.00, 1, 84, 0, '2025-11-11 15:13:00'),
(8, 'Full-time', 'paternity', 7, 0.58, 0, 7, 0, '2025-11-11 15:13:00');

-- --------------------------------------------------------

--
-- Table structure for table `leave_policy`
--

CREATE TABLE `leave_policy` (
  `policy_id` int(11) NOT NULL,
  `role` enum('Intern','Employee','HR') NOT NULL,
  `max_paid_leaves` int(11) NOT NULL,
  `max_casual_leaves` int(11) DEFAULT 0,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_policy`
--

INSERT INTO `leave_policy` (`policy_id`, `role`, `max_paid_leaves`, `max_casual_leaves`, `note`) VALUES
(1, 'Intern', 8, 0, 'Interns can take up to 8 paid leaves per year'),
(2, 'Employee', 12, 8, 'Regular employees can take 12 paid and 8 casual leaves per year'),
(3, 'HR', 15, 10, 'HR can take 15 paid and 10 casual leaves per year');

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `leave_type` varchar(30) NOT NULL,
  `leave_name` varchar(100) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `max_days` int(11) DEFAULT 20,
  `employee_types` varchar(255) DEFAULT 'Full-time,Intern,Contract,Part-time',
  `requires_document` tinyint(1) DEFAULT 0,
  `rules` text DEFAULT NULL,
  `carry_forward_allowed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`leave_type`, `leave_name`, `is_paid`, `max_days`, `employee_types`, `requires_document`, `rules`, `carry_forward_allowed`) VALUES
('CASUAL', 'Casual Leave', 0, 10, 'Full-time,Contract,Part-time', 0, 'Casual leave can be taken for short personal reasons. Prior approval from HR required.', 0),
('INJURY', 'Injury Leave', 1, 10, 'Full-time,Intern,Contract,Part-time', 1, 'Injury leave can be availed in case of accidents or physical injury. Supporting document required.', 0),
('INTERN_PAID', 'Intern Paid Leave', 1, 8, 'Intern', 0, 'Interns are allowed up to 8 paid leaves per year. Approval required from HR.', 0),
('Maternity Leave', 'Maternity Leave', 1, 84, 'Full-time,Contract,Part-time', 0, 'Maternity leave for childbirth - 12 weeks', 0),
('PAID', 'Paid Leave', 1, 20, 'Full-time,Contract,Part-time', 0, 'Paid leave can be used for vacation or emergencies. Approval required from HR or Manager.', 1),
('Paternity Leave', 'Paternity Leave', 1, 14, 'Full-time,Contract,Part-time', 0, 'Paternity leave for newborn child - 2 weeks', 0),
('SICK', 'Sick Leave', 1, 12, 'Full-time,Contract,Part-time', 1, 'Sick leave requires a valid medical certificate or doctor’s note for approval.', 0),
('UNPAID', 'Unpaid Leave', 0, 30, 'Full-time,Intern,Contract,Part-time', 0, 'Unpaid leave is granted only when all paid leave balance is used. HR approval required.', 0),
('Vacation', 'Vacation Leave', 1, 20, 'Full-time,Contract,Part-time', 0, 'Paid vacation leave, must be applied at least 2 weeks in advance', 0);

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
  `password` varchar(255) NOT NULL,
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
  `user_role` enum('HR','Employee') NOT NULL DEFAULT 'Employee',
  `employee_type` enum('Full-time','Intern','Contract','Part-time') DEFAULT 'Full-time',
  `remaining_paid_leaves` int(11) DEFAULT 0,
  `remaining_casual_leaves` int(11) DEFAULT 0,
  `date_of_joining` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_master`
--

INSERT INTO `users_master` (`user_id`, `user_name`, `email`, `password`, `department_id`, `role_id`, `designation`, `contact_number`, `is_active`, `approver_id`, `personal_email`, `mobile_phone`, `work_phone`, `home_address`, `preferred_name`, `date_of_birth`, `gender`, `nationality`, `pronouns`, `user_role`, `employee_type`, `remaining_paid_leaves`, `remaining_casual_leaves`, `date_of_joining`) VALUES
(30001, 'Brian HR', 'brian.hr@company.com', 'hr123', 1, 2, 'HR Manager', '1234567890', 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'HR', 'Full-time', 0, 0, NULL),
(40001, 'John Smith', 'john.smith@company.com', 'password123', 1, 1, 'Manager', '555-1001', 1, 30001, 'john.smith.personal@gmail.com', '555-1001', '555-9001', '123 Main St, New York, NY', 'John', '1985-03-15', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40002, 'Emma Wilson', 'emma.wilson@company.com', 'emma40002', 1, 2, 'HR Specialist', '8866378552', 1, 40001, 'emma.wilson.personal@gmail.com', '555-1002', '555-9002', '456 Oak Ave, Boston, MA', 'Emma', '1990-07-22', 'Female', 'American', 'She/Her', 'HR', 'Full-time', 0, 0, '2024-01-01'),
(40003, 'Michael Brown', 'michael.brown@company.com', 'password123', 2, 3, 'Senior Analyst', '555-1003', 1, 40001, 'michael.brown.personal@gmail.com', '555-1003', '555-9003', '789 Pine Rd, Chicago, IL', 'Mike', '1988-11-30', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40004, 'Sarah Johnson', 'sarah.johnson@company.com', 'password123', 4, 3, 'Sales Executive', '555-1004', 1, 40001, 'sarah.johnson.personal@gmail.com', '555-1004', '555-9004', '321 Elm St, Dallas, TX', 'Sarah', '1992-04-18', 'Female', 'American', 'She/Her', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40005, 'David Lee', 'david.lee@company.com', 'password123', 3, 4, 'Developer', '555-1005', 1, 40001, 'david.lee.personal@gmail.com', '555-1005', '555-9005', '654 Maple Dr, Seattle, WA', 'David', '1993-09-05', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40006, 'Lisa Garcia', 'lisa.garcia@company.com', 'password123', 5, 3, 'Marketing Manager', '555-1006', 1, 40001, 'lisa.garcia.personal@gmail.com', '555-1006', '555-9006', '987 Cedar Ln, Miami, FL', 'Lisa', '1987-12-12', 'Female', 'American', 'She/Her', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40007, 'Robert Chen', 'robert.chen@company.com', 'password123', 6, 4, 'Research Assistant', '555-1007', 1, 40001, 'robert.chen.personal@gmail.com', '555-1007', '555-9007', '147 Birch Ave, San Jose, CA', 'Rob', '1994-06-25', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40008, 'Amanda Patel', 'amanda.patel@company.com', 'password123', 2, 4, 'Accountant', '555-1008', 1, 40001, 'amanda.patel.personal@gmail.com', '555-1008', '555-9008', '258 Willow St, Houston, TX', 'Mandy', '1991-08-14', 'Female', 'American', 'She/Her', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40009, 'James Miller', 'james.miller@company.com', 'password123', 4, 4, 'Sales Representative', '555-1009', 1, 40001, 'james.miller.personal@gmail.com', '555-1009', '555-9009', '369 Spruce Rd, Atlanta, GA', 'James', '1989-01-29', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40010, 'Jennifer Davis', 'jennifer.davis@company.com', 'password123', 5, 5, 'Marketing Intern', '555-1010', 1, 40001, 'jennifer.davis.personal@gmail.com', '555-1010', '555-9010', '741 Palm Blvd, Phoenix, AZ', 'Jen', '1996-03-08', 'Female', 'American', 'She/Her', 'Employee', 'Intern', 0, 0, '2024-01-01'),
(40011, 'Thomas Wilson', 'thomas.wilson@company.com', 'password123', 6, 3, 'Senior Researcher', '555-1011', 1, 40001, 'thomas.wilson.personal@gmail.com', '555-1011', '555-9011', '852 Redwood Cir, Portland, OR', 'Tom', '1986-10-17', 'Male', 'American', 'He/Him', 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40012, 'Het', 'hetpatel@gmail.com', 'het40012', 5, 4, 'Junior', '8866378552', 0, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40013, 'Nensi', 'nensi@gmail.com', 'nens40013', 2, 4, 'Analyst', '3377886644', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40014, 'Apurva', 'apurva@gmail.com', 'apur40014', 3, 4, 'Junior', '9999000089', 0, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40015, 'Saumya', 'saumya@company.com', 'saum40015', 6, 4, 'Senior', '3434343483', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40016, 'Milli', 'milli@company.com', 'mill40016', 1, 4, 'Junior', '5566778899', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, '2024-01-01'),
(40017, 'prince', 'pp@gmail.com', 'prin40017', 2, 4, 'Contract', '6565656565', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'HR', 'Full-time', 0, 0, NULL),
(40018, 'PP', 'ppp@gmail.com', 'pp40018', 2, 4, 'full Time', '3434343434', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40019, 'hghg', 'hghg@gmail.com', 'hghg40019', 1, 4, 'Contract', '4565456546', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40020, 'asdasdasdasd', 'asdasd@gmail.com', 'asda40020', 2, 4, 'xyz', 'asdasdasdasd', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40021, 'abc', 'abc@gmail.com', 'abc40021', 3, 4, 'Junior', '4646353528', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40022, 'xyzxyz', 'xyzxyz@gmail.com', 'xyzx40022', 5, 4, 'Seni', '3546278937', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40023, 'Deepak', 'deepak@gmail.com', 'deep40023', 4, 4, 'Intern', '7658746573', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL),
(40024, 'Akshil', 'akshil@gmail.com', 'aksh40024', 5, 4, 'Contract', '7878908765', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee', 'Full-time', 0, 0, NULL);

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
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`holiday_id`);

--
-- Indexes for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  ADD PRIMARY KEY (`accrual_id`),
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
  ADD PRIMARY KEY (`balance_id`),
  ADD UNIQUE KEY `user_leave_type_year` (`user_id`,`leave_type`,`leave_year`),
  ADD KEY `leave_type` (`leave_type`);

--
-- Indexes for table `leave_policies`
--
ALTER TABLE `leave_policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_policy` (`employee_type`,`leave_type`);

--
-- Indexes for table `leave_policy`
--
ALTER TABLE `leave_policy`
  ADD PRIMARY KEY (`policy_id`);

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
  MODIFY `contact_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `holiday_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  MODIFY `accrual_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_application`
--
ALTER TABLE `leave_application`
  MODIFY `leave_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `leave_balance`
--
ALTER TABLE `leave_balance`
  MODIFY `balance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `leave_policies`
--
ALTER TABLE `leave_policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `leave_policy`
--
ALTER TABLE `leave_policy`
  MODIFY `policy_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD CONSTRAINT `fk_emergency_contacts_user` FOREIGN KEY (`user_id`) REFERENCES `users_master` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  ADD CONSTRAINT `leave_accruals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_master` (`user_id`);

--
-- Constraints for table `users_master`
--
ALTER TABLE `users_master`
  ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`),
  ADD CONSTRAINT `users_master_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`),
  ADD CONSTRAINT `users_master_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
