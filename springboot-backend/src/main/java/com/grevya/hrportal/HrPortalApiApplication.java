package com.grevya.hrportal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@SpringBootApplication
public class HrPortalApiApplication implements WebMvcConfigurer {

  public static void main(String[] args) {
    SpringApplication.run(HrPortalApiApplication.class, args);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
      .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
      .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
      .allowedHeaders("*");
  }

  @RestController
  @RequestMapping("/api")
  public static class HrPortalController {
    private final List<UserAccount> users = new CopyOnWriteArrayList<>();
    private final List<Employee> employees = new CopyOnWriteArrayList<>();
    private final List<HrManager> hrManagers = new CopyOnWriteArrayList<>();
    private final List<LeaveRequest> leaveRequests = new CopyOnWriteArrayList<>();
    private final List<NotificationItem> notifications = new CopyOnWriteArrayList<>();
    private final List<JobOpening> jobs = new CopyOnWriteArrayList<>();
    private final List<Candidate> candidates = new CopyOnWriteArrayList<>();

    HrPortalController() {
      seed();
    }

    @PostMapping("/auth/login")
    ResponseEntity<User> login(@Valid @RequestBody LoginRequest request) {
      return users.stream()
        .filter(user -> user.email.equalsIgnoreCase(request.email()) && user.password.equals(request.password()))
        .findFirst()
        .map(UserAccount::toUser)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @GetMapping("/bootstrap")
    Bootstrap bootstrap() {
      return new Bootstrap(employees, hrManagers, leaveRequests, notifications);
    }

    @GetMapping("/employees")
    List<Employee> employees() {
      return employees;
    }

    @PostMapping("/employees")
    Employee addEmployee(@RequestBody Employee employee) {
      employee.id = "e" + System.currentTimeMillis();
      employees.add(employee);
      return employee;
    }

    @PutMapping("/employees/{id}")
    ResponseEntity<Employee> updateEmployee(@PathVariable String id, @RequestBody Employee patch) {
      return findEmployee(id)
        .map(employee -> {
          employee.copyEditableFieldsFrom(patch);
          return ResponseEntity.ok(employee);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/employees/{id}")
    Map<String, Boolean> deleteEmployee(@PathVariable String id) {
      employees.removeIf(employee -> employee.id.equals(id));
      leaveRequests.removeIf(request -> request.employeeId.equals(id));
      return Map.of("success", true);
    }

    @GetMapping("/hr-managers")
    List<HrManager> hrManagers() {
      return hrManagers;
    }

    @PostMapping("/hr-managers")
    HrManager addHrManager(@RequestBody HrManager manager) {
      manager.id = "m" + System.currentTimeMillis();
      hrManagers.add(manager);
      return manager;
    }

    @PutMapping("/hr-managers/{id}")
    ResponseEntity<HrManager> updateHrManager(@PathVariable String id, @RequestBody HrManager patch) {
      return findHrManager(id)
        .map(manager -> {
          manager.copyEditableFieldsFrom(patch);
          return ResponseEntity.ok(manager);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/hr-managers/{id}/toggle-status")
    ResponseEntity<HrManager> toggleHrManagerStatus(@PathVariable String id) {
      return findHrManager(id)
        .map(manager -> {
          manager.status = "active".equals(manager.status) ? "inactive" : "active";
          return ResponseEntity.ok(manager);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/hr-managers/{id}")
    Map<String, Boolean> deleteHrManager(@PathVariable String id) {
      hrManagers.removeIf(manager -> manager.id.equals(id));
      String fallbackManagerId = hrManagers.isEmpty() ? "m1" : hrManagers.get(0).id;
      employees.forEach(employee -> {
        if (id.equals(employee.managerId)) employee.managerId = fallbackManagerId;
      });
      return Map.of("success", true);
    }

    @PutMapping("/leave-requests/{id}")
    ResponseEntity<LeaveRequest> updateLeave(@PathVariable String id, @RequestBody LeaveDecision decision) {
      return findLeaveRequest(id)
        .map(request -> {
          request.status = decision.status();
          request.approvedBy = decision.approvedBy();
          request.comments = decision.comments();
          return ResponseEntity.ok(request);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/leave-requests")
    LeaveRequest applyLeave(@RequestBody LeaveRequest request) {
      request.id = "l" + System.currentTimeMillis();
      request.status = "pending";
      request.appliedOn = LocalDate.now().toString();
      leaveRequests.add(0, request);
      return request;
    }

    @PutMapping("/notifications/{id}/read")
    ResponseEntity<NotificationItem> markRead(@PathVariable String id) {
      return notifications.stream()
        .filter(notification -> notification.id.equals(id))
        .findFirst()
        .map(notification -> {
          notification.read = true;
          return ResponseEntity.ok(notification);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/notifications/mark-all-read")
    List<NotificationItem> markAllRead() {
      notifications.forEach(notification -> notification.read = true);
      return notifications;
    }

    @GetMapping("/jobs")
    List<JobOpening> jobs() {
      return jobs;
    }

    @PostMapping("/jobs")
    JobOpening addJob(@RequestBody JobOpening job) {
      job.id = "j" + System.currentTimeMillis();
      jobs.add(0, job);
      return job;
    }

    @PutMapping("/jobs/{id}")
    ResponseEntity<JobOpening> updateJob(@PathVariable String id, @RequestBody JobOpening patch) {
      return jobs.stream()
        .filter(job -> job.id.equals(id))
        .findFirst()
        .map(job -> {
          job.copyEditableFieldsFrom(patch);
          return ResponseEntity.ok(job);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/candidates")
    List<Candidate> candidates() {
      return candidates;
    }

    @PostMapping("/candidates")
    Candidate addCandidate(@RequestBody Candidate candidate) {
      candidate.id = "c" + System.currentTimeMillis();
      candidates.add(0, candidate);
      return candidate;
    }

    @PutMapping("/candidates/{id}")
    ResponseEntity<Candidate> updateCandidate(@PathVariable String id, @RequestBody Candidate patch) {
      return candidates.stream()
        .filter(candidate -> candidate.id.equals(id))
        .findFirst()
        .map(candidate -> {
          candidate.copyEditableFieldsFrom(patch);
          return ResponseEntity.ok(candidate);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Optional<Employee> findEmployee(String id) {
      return employees.stream().filter(employee -> employee.id.equals(id)).findFirst();
    }

    private Optional<HrManager> findHrManager(String id) {
      return hrManagers.stream().filter(manager -> manager.id.equals(id)).findFirst();
    }

    private Optional<LeaveRequest> findLeaveRequest(String id) {
      return leaveRequests.stream().filter(request -> request.id.equals(id)).findFirst();
    }

    private void seed() {
      users.add(new UserAccount("admin-1", "Anika Rao", "admin@grevya.com", "admin123", "admin", "Executive", "System Admin", "AR", "2019-01-10", null));
      users.add(new UserAccount("u1", "Divya Kumar", "hr@grevya.com", "hr123", "hr_manager", "HR", "HR Manager", "DK", "2021-03-22", null));
      users.add(new UserAccount("u2", "Ravi Nair", "manager@grevya.com", "mgr123", "manager", "Sales", "Sales Manager", "RN", "2020-11-20", "u1"));
      users.add(new UserAccount("u3", "Kiran Patel", "employee@grevya.com", "emp123", "employee", "Engineering", "Backend Developer", "KP", "2022-03-15", "u2"));

      hrManagers.add(new HrManager("m1", "Divya Kumar", "hr@grevya.com", "HR", "active", "DK", "2021-03-22", "+91 43210 98765", "Pune"));
      hrManagers.add(new HrManager("m2", "Ravi Nair", "manager@grevya.com", "Sales", "active", "RN", "2020-11-20", "+91 76543 21098", "Delhi"));
      hrManagers.add(new HrManager("m3", "Ishita Banerjee", "ishita.banerjee@grevya.com", "Marketing", "active", "IB", "2022-04-08", "+91 99887 44120", "Kolkata"));
      hrManagers.add(new HrManager("m4", "Mehul Saini", "mehul.saini@grevya.com", "Engineering", "active", "MS", "2020-06-14", "+91 88776 33019", "Hyderabad"));
      hrManagers.add(new HrManager("m5", "Naina Mehta", "naina.mehta@grevya.com", "Finance", "inactive", "NM", "2023-01-16", "+91 77665 22918", "Mumbai"));

      employees.add(new Employee("e1", "Kiran Patel", "kiran.patel@grevya.com", "Engineering", "Backend Developer", "active", "2022-03-15", 85000, 92, 97, "KP", "m1", "+91 98765 43210", "Bangalore", 2840, List.of("perfect_attendance", "top_performer"), 45));
      employees.add(new Employee("e2", "Sneha Rao", "sneha.rao@grevya.com", "Content", "Content Lead", "active", "2021-07-01", 72000, 88, 94, "SR", "m2", "+91 87654 32109", "Mumbai", 3120, List.of("top_performer"), 62));
      employees.add(new Employee("e3", "Ravi Nair", "ravi.nair@grevya.com", "Sales", "Sales Manager", "active", "2020-11-20", 95000, 95, 99, "RN", "m1", "+91 76543 21098", "Delhi", 4200, List.of("perfect_attendance"), 90));
      employees.add(new Employee("e4", "Priya Sharma", "priya.sharma@grevya.com", "Design", "UI/UX Designer", "active", "2023-01-10", 78000, 85, 91, "PS", "m2", "+91 65432 10987", "Hyderabad", 1950, List.of("team_player"), 28));
      employees.add(new Employee("e5", "Arjun Mehta", "arjun.mehta@grevya.com", "Engineering", "Frontend Developer", "on_leave", "2022-09-05", 80000, 79, 85, "AM", "m1", "+91 54321 09876", "Chennai", 1620, List.of("team_player"), 12));
      employees.add(new Employee("e6", "Divya Kumar", "divya.kumar@grevya.com", "HR", "HR Executive", "active", "2021-03-22", 65000, 91, 96, "DK", "m2", "+91 43210 98765", "Pune", 2680, List.of("mentor"), 38));

      leaveRequests.add(new LeaveRequest("l1", "e5", "Arjun Mehta", "AM", "Engineering", "sick", "2024-03-18", "2024-03-22", 5, "Fever and flu, doctor recommended rest", "pending", "2024-03-17", null, null));
      leaveRequests.add(new LeaveRequest("l2", "e4", "Priya Sharma", "PS", "Design", "casual", "2024-03-25", "2024-03-26", 2, "Family function and travel", "approved", "2024-03-15", "Ravi Nair", "Approved."));
      leaveRequests.add(new LeaveRequest("l3", "e8", "Ananya Singh", "AS", "Marketing", "annual", "2024-04-01", "2024-04-07", 7, "Annual vacation with family", "pending", "2024-03-20", null, null));

      notifications.add(new NotificationItem("n1", "Leave Request Pending", "Arjun Mehta has applied for sick leave.", "warning", "2024-03-17T10:30:00", false));
      notifications.add(new NotificationItem("n2", "Performance Review Due", "Q1 performance reviews are due soon.", "info", "2024-03-15T09:00:00", false));
      notifications.add(new NotificationItem("n3", "New Employee Onboarded", "Suresh Pillai completed onboarding.", "success", "2024-03-14T14:20:00", true));

      jobs.add(new JobOpening("j1", "Senior Backend Engineer", "Engineering", "full_time", "Bangalore", 2, "2024-03-01", "active"));
      jobs.add(new JobOpening("j2", "Product Designer", "Design", "full_time", "Remote", 1, "2024-03-05", "active"));
      jobs.add(new JobOpening("j3", "Sales Executive", "Sales", "full_time", "Delhi", 3, "2024-03-10", "active"));

      candidates.add(new Candidate("c1", "Aditya Verma", "aditya@email.com", "+91 98700 00001", "Senior Backend Engineer", "Engineering", "interview", "2024-03-10", "AV", 82, "Strong Python skills."));
      candidates.add(new Candidate("c2", "Ritika Shah", "ritika@email.com", "+91 98700 00002", "Product Designer", "Design", "screening", "2024-03-12", "RS", 75, null));
      candidates.add(new Candidate("c3", "Manish Tiwari", "manish@email.com", "+91 98700 00003", "Sales Executive", "Sales", "applied", "2024-03-15", "MT", null, null));
    }
  }

  public record LoginRequest(@Email String email, @NotBlank String password) {}
  public record LeaveDecision(String status, String approvedBy, String comments) {}
  public record Bootstrap(List<Employee> employees, List<HrManager> hrManagers, List<LeaveRequest> leaveRequests, List<NotificationItem> notifications) {}

  public static class UserAccount extends User {
    public String password;

    UserAccount(String id, String name, String email, String password, String role, String department, String position, String avatar, String joinDate, String managerId) {
      super(id, name, email, role, department, position, avatar, joinDate, managerId);
      this.password = password;
    }

    User toUser() {
      return new User(id, name, email, role, department, position, avatar, joinDate, managerId);
    }
  }

  public static class User {
    public String id;
    public String name;
    public String email;
    public String role;
    public String department;
    public String position;
    public String avatar;
    public String joinDate;
    public String managerId;

    User(String id, String name, String email, String role, String department, String position, String avatar, String joinDate, String managerId) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.role = role;
      this.department = department;
      this.position = position;
      this.avatar = avatar;
      this.joinDate = joinDate;
      this.managerId = managerId;
    }
  }

  public static class Employee {
    public String id;
    public String name;
    public String email;
    public String department;
    public String position;
    public String status;
    public String joinDate;
    public double salary;
    public int performance;
    public int attendance;
    public String avatar;
    public String managerId;
    public String phone;
    public String location;
    public int points;
    public List<String> badges = new ArrayList<>();
    public int streak;

    public Employee() {}

    Employee(String id, String name, String email, String department, String position, String status, String joinDate, double salary, int performance, int attendance, String avatar, String managerId, String phone, String location, int points, List<String> badges, int streak) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.department = department;
      this.position = position;
      this.status = status;
      this.joinDate = joinDate;
      this.salary = salary;
      this.performance = performance;
      this.attendance = attendance;
      this.avatar = avatar;
      this.managerId = managerId;
      this.phone = phone;
      this.location = location;
      this.points = points;
      this.badges = new ArrayList<>(badges);
      this.streak = streak;
    }

    void copyEditableFieldsFrom(Employee patch) {
      this.name = patch.name;
      this.email = patch.email;
      this.department = patch.department;
      this.position = patch.position;
      this.status = patch.status;
      this.joinDate = patch.joinDate;
      this.salary = patch.salary;
      this.performance = patch.performance;
      this.attendance = patch.attendance;
      this.avatar = patch.avatar;
      this.managerId = patch.managerId;
      this.phone = patch.phone;
      this.location = patch.location;
      this.points = patch.points;
      this.badges = patch.badges == null ? new ArrayList<>() : new ArrayList<>(patch.badges);
      this.streak = patch.streak;
    }
  }

  public static class HrManager {
    public String id;
    public String name;
    public String email;
    public String department;
    public String status;
    public String avatar;
    public String joinDate;
    public String phone;
    public String location;

    public HrManager() {}

    HrManager(String id, String name, String email, String department, String status, String avatar, String joinDate, String phone, String location) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.department = department;
      this.status = status;
      this.avatar = avatar;
      this.joinDate = joinDate;
      this.phone = phone;
      this.location = location;
    }

    void copyEditableFieldsFrom(HrManager patch) {
      this.name = patch.name;
      this.email = patch.email;
      this.department = patch.department;
      this.status = patch.status;
      this.avatar = patch.avatar;
      this.joinDate = patch.joinDate;
      this.phone = patch.phone;
      this.location = patch.location;
    }
  }

  public static class LeaveRequest {
    public String id;
    public String employeeId;
    public String employeeName;
    public String employeeAvatar;
    public String department;
    public String type;
    public String startDate;
    public String endDate;
    public int days;
    public String reason;
    public String status;
    public String appliedOn;
    public String approvedBy;
    public String comments;

    public LeaveRequest() {}

    LeaveRequest(String id, String employeeId, String employeeName, String employeeAvatar, String department, String type, String startDate, String endDate, int days, String reason, String status, String appliedOn, String approvedBy, String comments) {
      this.id = id;
      this.employeeId = employeeId;
      this.employeeName = employeeName;
      this.employeeAvatar = employeeAvatar;
      this.department = department;
      this.type = type;
      this.startDate = startDate;
      this.endDate = endDate;
      this.days = days;
      this.reason = reason;
      this.status = status;
      this.appliedOn = appliedOn;
      this.approvedBy = approvedBy;
      this.comments = comments;
    }
  }

  public static class NotificationItem {
    public String id;
    public String title;
    public String message;
    public String type;
    public String timestamp;
    public boolean read;

    public NotificationItem() {}

    NotificationItem(String id, String title, String message, String type, String timestamp, boolean read) {
      this.id = id;
      this.title = title;
      this.message = message;
      this.type = type;
      this.timestamp = timestamp;
      this.read = read;
    }
  }

  public static class JobOpening {
    public String id;
    public String title;
    public String department;
    public String type;
    public String location;
    public int openings;
    public String posted;
    public String status;

    public JobOpening() {}

    JobOpening(String id, String title, String department, String type, String location, int openings, String posted, String status) {
      this.id = id;
      this.title = title;
      this.department = department;
      this.type = type;
      this.location = location;
      this.openings = openings;
      this.posted = posted;
      this.status = status;
    }

    void copyEditableFieldsFrom(JobOpening patch) {
      this.title = patch.title;
      this.department = patch.department;
      this.type = patch.type;
      this.location = patch.location;
      this.openings = patch.openings;
      this.posted = patch.posted;
      this.status = patch.status;
    }
  }

  public static class Candidate {
    public String id;
    public String name;
    public String email;
    public String phone;
    public String position;
    public String department;
    public String stage;
    public String appliedDate;
    public String avatar;
    public Integer score;
    public String note;

    public Candidate() {}

    Candidate(String id, String name, String email, String phone, String position, String department, String stage, String appliedDate, String avatar, Integer score, String note) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.phone = phone;
      this.position = position;
      this.department = department;
      this.stage = stage;
      this.appliedDate = appliedDate;
      this.avatar = avatar;
      this.score = score;
      this.note = note;
    }

    void copyEditableFieldsFrom(Candidate patch) {
      this.name = patch.name;
      this.email = patch.email;
      this.phone = patch.phone;
      this.position = patch.position;
      this.department = patch.department;
      this.stage = patch.stage;
      this.appliedDate = patch.appliedDate;
      this.avatar = patch.avatar;
      this.score = patch.score;
      this.note = patch.note;
    }
  }
}
