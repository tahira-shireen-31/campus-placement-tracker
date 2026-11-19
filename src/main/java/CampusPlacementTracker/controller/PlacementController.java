
package CampusPlacementTracker.controller;

import CampusPlacementTracker.entity.Placement;
import CampusPlacementTracker.entity.Student;
import CampusPlacementTracker.repository.PlacementRepository;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/placements")
public class PlacementController {

    private final PlacementRepository placementRepository;

    public PlacementController(PlacementRepository placementRepository) {
        this.placementRepository = placementRepository;
    }

    // Check whether a student is logged in
    private Integer getStudentId(HttpSession session) {

        Integer studentId = (Integer) session.getAttribute("studentId");

        if (studentId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first!"
            );
        }

        return studentId;
    }

    // 1. View only the logged-in student's placements
    @GetMapping
    public List<Placement> getAllPlacements(HttpSession session) {

        Integer studentId = getStudentId(session);

        return placementRepository.findAllByStudentId(studentId);
    }

    // 2. Add a placement to the logged-in student's account
    @PostMapping
    public Placement addPlacement(
            @Valid @RequestBody Placement placement,
            HttpSession session) {

        Integer studentId = getStudentId(session);

        boolean duplicate = placementRepository
                .existsByCompanyNameIgnoreCaseAndRoleIgnoreCaseAndApplicationDateAndStudentId(
                        placement.getCompanyName(),
                        placement.getRole(),
                        placement.getApplicationDate(),
                        studentId
                );

        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This placement application already exists!"
            );
        }

        Student student = new Student();
        student.setId(studentId);
        placement.setStudent(student);

        return placementRepository.save(placement);
    }

    // 3. Search only the logged-in student's placements
    @GetMapping("/search")
    public List<Placement> searchCompany(
            @RequestParam String company,
            HttpSession session) {

        Integer studentId = getStudentId(session);

        return placementRepository
                .findByCompanyNameContainingIgnoreCaseAndStudentId(
                        company,
                        studentId
                );
    }

    // 4. Update only the logged-in student's placement
    @PutMapping("/{id}")
    public Placement updatePlacement(
            @PathVariable Integer id,
            @Valid @RequestBody Placement updatedPlacement,
            HttpSession session) {

        Integer studentId = getStudentId(session);

        Placement existingPlacement = placementRepository
                .findByIdAndStudentId(id, studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Placement not found"
                ));

        boolean duplicate = placementRepository
                .existsByCompanyNameIgnoreCaseAndRoleIgnoreCaseAndApplicationDateAndStudentIdAndIdNot(
                        updatedPlacement.getCompanyName(),
                        updatedPlacement.getRole(),
                        updatedPlacement.getApplicationDate(),
                        studentId,
                        id
                );

        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another placement with the same details already exists!"
            );
        }

        existingPlacement.setCompanyName(updatedPlacement.getCompanyName());
        existingPlacement.setRole(updatedPlacement.getRole());
        existingPlacement.setApplicationDate(updatedPlacement.getApplicationDate());
        existingPlacement.setLocation(updatedPlacement.getLocation());
        existingPlacement.setStatus(updatedPlacement.getStatus());

        return placementRepository.save(existingPlacement);
    }

    // 5. Delete only the logged-in student's placement
    @DeleteMapping("/{id}")
    public String deletePlacement(
            @PathVariable Integer id,
            HttpSession session) {

        Integer studentId = getStudentId(session);

        Placement placement = placementRepository
                .findByIdAndStudentId(id, studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Placement not found"
                ));

        placementRepository.delete(placement);

        return "Placement deleted successfully!";
    }
}

