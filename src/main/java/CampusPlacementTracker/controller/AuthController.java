
package CampusPlacementTracker.controller;

import CampusPlacementTracker.dto.RegisterRequest;
import CampusPlacementTracker.dto.LoginRequest;
import CampusPlacementTracker.entity.Student;
import CampusPlacementTracker.service.StudentService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final StudentService studentService;

    public AuthController(StudentService studentService) {
        this.studentService = studentService;
    }

    // STUDENT REGISTRATION
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request) {

        Student student = studentService.registerStudent(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Registration successful!",
                        "name", student.getFullName()
                ));
    }

    // STUDENT LOGIN
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @Valid @RequestBody LoginRequest request,
            HttpSession session) {

        Student student = studentService.loginStudent(
                request.getEmail(),
                request.getPassword()
        );

        // Store student ID in the session
        session.setAttribute("studentId", student.getId());

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful!",
                        "name", student.getFullName(),
                        "email", student.getEmail()
                )
        );
    }

    // STUDENT LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpSession session) {

        session.invalidate();

        return ResponseEntity.ok(
                Map.of("message", "Logout successful!")
        );
    }

    // CHECK CURRENTLY LOGGED-IN STUDENT
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            HttpSession session) {

        Integer studentId =
                (Integer) session.getAttribute("studentId");

        if (studentId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Please log in first!"
                    ));
        }

        return ResponseEntity.ok(
                Map.of("studentId", studentId)
        );
    }
}

