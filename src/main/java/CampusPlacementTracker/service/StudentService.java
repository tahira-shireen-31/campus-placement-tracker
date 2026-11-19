
package CampusPlacementTracker.service;

import CampusPlacementTracker.entity.Student;
import CampusPlacementTracker.dto.RegisterRequest;
import CampusPlacementTracker.repository.StudentRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder) {

        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Student registerStudent(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (studentRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered!");
        }

        Student student = new Student();

        student.setFullName(request.getFullName().trim());
        student.setEmail(email);

        String hashedPassword =
                passwordEncoder.encode(request.getPassword());

        student.setPasswordHash(hashedPassword);

        return studentRepository.save(student);
        
    }

public Student loginStudent(String email, String password) {

    Student student = studentRepository
            .findByEmail(email.trim().toLowerCase())
            .orElseThrow(() ->
                    new RuntimeException("Invalid email or password!")
            );

    boolean passwordMatches = passwordEncoder.matches(
            password,
            student.getPasswordHash()
    );

    if (!passwordMatches) {
        throw new RuntimeException("Invalid email or password!");
    }

    return student;
}

}

