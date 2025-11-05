-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 05, 2025 at 05:25 AM
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
(18, 40008, 'Maternity Leave', '2025-11-03 15:05:09', '2025-11-03', '2025-11-07', 'Illniss', NULL, 'approved'),
(19, 40008, 'Maternity Leave', '2025-11-04 23:06:18', '2025-12-26', '2025-12-26', 'Nensi mummy banseeee baby avvse :)', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEASABIAAD/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0', 'approved'),
(20, 40008, 'Maternity Leave', '2025-11-04 23:10:58', '2025-11-04', '2025-11-05', 'feefefe', NULL, 'pending');

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
(40001, 'Sick Leave', 7, 2, 5),
(40001, 'Vacation', 5, 1, 4),
(40001, 'Casual Leave', 3, 0, 3),
(40002, 'Sick Leave', 6, 3, 1),
(40002, 'Vacation', 6, 2, 4),
(40002, 'Casual Leave', 3, 1, 2),
(40003, 'Sick Leave', 8, 0, 8),
(40003, 'Vacation', 4, 3, 1),
(40003, 'Casual Leave', 3, 0, 3),
(40004, 'Sick Leave', 5, 2, 3),
(40004, 'Vacation', 7, 1, 6),
(40004, 'Casual Leave', 3, 1, 2),
(40005, 'Sick Leave', 6, 1, 5),
(40005, 'Vacation', 5, 0, 5),
(40005, 'Casual Leave', 4, 2, 2),
(40006, 'Sick Leave', 7, 3, 4),
(40006, 'Vacation', 5, 2, 3),
(40006, 'Casual Leave', 3, 0, 3),
(40007, 'Sick Leave', 5, 0, 5),
(40007, 'Vacation', 6, 4, 2),
(40007, 'Casual Leave', 4, 1, 3),
(40008, 'Sick Leave', 6, 2, 4),
(40008, 'Vacation', 5, 1, 4),
(40008, 'Casual Leave', 4, 0, 4),
(40009, 'Sick Leave', 7, 1, 6),
(40009, 'Vacation', 4, 2, 2),
(40009, 'Casual Leave', 4, 1, 3),
(40010, 'Sick Leave', 5, 0, 5),
(40010, 'Vacation', 6, 3, 3),
(40010, 'Casual Leave', 4, 2, 2),
(40011, 'Sick Leave', 6, 1, 5),
(40011, 'Vacation', 5, 0, 5),
(40011, 'Casual Leave', 4, 1, 3),
(40012, 'Sick Leave', 10, 0, 10),
(40012, 'Vacation', 15, 0, 15),
(40012, 'Casual Leave', 12, 0, 12),
(40013, 'Sick Leave', 10, 0, 10),
(40013, 'Vacation', 15, 0, 15),
(40013, 'Casual Leave', 12, 0, 12);

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
('Casual Leave', 'Personal leave for emergencies or personal work', 1),
('Maternity Leave', 'Maternity leave for childbirth - 12 weeks', 0),
('Paternity Leave', 'Paternity leave for newborn child - 2 weeks', 0),
('Sick Leave', 'Paid sick leave with medical certificate required for more than 3 days', 1),
('Vacation', 'Paid vacation leave, must be applied at least 2 weeks in advance', 0);

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
  `pronouns` varchar(20) DEFAULT NULL,
  `user_role` enum('HR','Employee') NOT NULL DEFAULT 'Employee'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_master`
--

INSERT INTO `users_master` (`user_id`, `user_name`, `email`, `password`, `department_id`, `role_id`, `designation`, `contact_number`, `is_active`, `approver_id`, `personal_email`, `mobile_phone`, `work_phone`, `home_address`, `preferred_name`, `date_of_birth`, `gender`, `nationality`, `pronouns`, `user_role`) VALUES
(40002, 'Emma Wilson', 'emma.wilson@company.com', 'emma40002', 1, 2, 'HR Specialist', '555-1002', 1, 40001, 'emma.wilson.personal@gmail.com', '555-1002', '555-9002', '456 Oak Ave, Boston, MA', 'Emma', '1990-07-22', 'Female', 'American', 'She/Her', 'HR'),
(40003, 'Michael Brown', 'michael.brown@company.com', 'password123', 2, 3, 'Senior Analyst', '555-1003', 1, 40001, 'michael.brown.personal@gmail.com', '555-1003', '555-9003', '789 Pine Rd, Chicago, IL', 'Mike', '1988-11-30', 'Male', 'American', 'He/Him', 'Employee'),
(40004, 'Sarah Johnson', 'sarah.johnson@company.com', 'password123', 4, 3, 'Sales Executive', '555-1004', 1, 40001, 'sarah.johnson.personal@gmail.com', '555-1004', '555-9004', '321 Elm St, Dallas, TX', 'Sarah', '1992-04-18', 'Female', 'American', 'She/Her', 'Employee'),
(40005, 'David Lee', 'david.lee@company.com', 'password123', 3, 4, 'Developer', '555-1005', 1, 40001, 'david.lee.personal@gmail.com', '555-1005', '555-9005', '654 Maple Dr, Seattle, WA', 'David', '1993-09-05', 'Male', 'American', 'He/Him', 'Employee'),
(40006, 'Lisa Garcia', 'lisa.garcia@company.com', 'password123', 5, 3, 'Marketing Manager', '555-1006', 1, 40001, 'lisa.garcia.personal@gmail.com', '555-1006', '555-9006', '987 Cedar Ln, Miami, FL', 'Lisa', '1987-12-12', 'Female', 'American', 'She/Her', 'Employee'),
(40007, 'Robert Chen', 'robert.chen@company.com', 'password123', 6, 4, 'Research Assistant', '555-1007', 1, 40001, 'robert.chen.personal@gmail.com', '555-1007', '555-9007', '147 Birch Ave, San Jose, CA', 'Rob', '1994-06-25', 'Male', 'American', 'He/Him', 'Employee'),
(40008, 'Amanda PAtell', 'amanda.taylor@company.com', 'password123', 2, 4, 'Accountant', '', 1, 40001, NULL, NULL, NULL, NULL, 'Mandy', '1991-08-14', 'Female', 'American', 'She/Her', 'Employee'),
(40009, 'James Miller', 'james.miller@company.com', 'password123', 4, 4, 'Sales Representative', '555-1009', 1, 40001, 'james.miller.personal@gmail.com', '555-1009', '555-9009', '369 Spruce Rd, Atlanta, GA', 'James', '1989-01-29', 'Male', 'American', 'He/Him', 'Employee'),
(40010, 'Jennifer Davis', 'jennifer.davis@company.com', 'password123', 5, 5, 'Marketing Intern', '555-1010', 1, 40001, 'jennifer.davis.personal@gmail.com', '555-1010', '555-9010', '741 Palm Blvd, Phoenix, AZ', 'Jen', '1996-03-08', 'Female', 'American', 'She/Her', 'Employee'),
(40011, 'Thomas Wilson', 'thomas.wilson@company.com', 'password123', 6, 3, 'Senior Researcher', '555-1011', 1, 40001, 'thomas.wilson.personal@gmail.com', '555-1011', '555-9011', '852 Redwood Cir, Portland, OR', 'Tom', '1986-10-17', 'Male', 'American', 'He/Him', 'Employee'),
(40012, 'Het', 'hetpatel@gmai.com', 'het40012', 5, 4, 'Junior', '2211221122', 0, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee'),
(40013, 'Nensi', 'nensi@gmail.com', 'nens40013', 2, 4, 'Seniorrrrr', '3377886644', 1, 30001, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Employee');

--
-- Triggers `users_master`
--
DELIMITER $$
CREATE TRIGGER `after_user_insert` AFTER INSERT ON `users_master` FOR EACH ROW BEGIN
    -- Insert zero leave balances for new employees (no carry forward)
    INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves)
    VALUES
    (NEW.user_id, 'Sick Leave', 0, 0, 0),
    (NEW.user_id, 'Vacation', 0, 0, 0),
    (NEW.user_id, 'Casual Leave', 0, 0, 0);

    -- Insert Maternity/Paternity leaves (0 balance by default)
    INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves)
    VALUES
    (NEW.user_id, 'Maternity Leave', 0, 0, 0),
    (NEW.user_id, 'Paternity Leave', 0, 0, 0);
END
$$
DELIMITER ;

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
  MODIFY `contact_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `leave_application`
--
ALTER TABLE `leave_application`
  MODIFY `leave_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
