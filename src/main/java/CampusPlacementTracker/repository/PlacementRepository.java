
package CampusPlacementTracker.repository;

import CampusPlacementTracker.entity.Placement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;

public interface PlacementRepository extends JpaRepository<Placement, Integer> {

    // Get placements belonging to a particular student
    List<Placement> findAllByStudentId(Integer studentId);

    // Find a specific placement belonging to a student
    Optional<Placement> findByIdAndStudentId(Integer id, Integer studentId);

    // Search company name within a student's placements
    List<Placement> findByCompanyNameContainingIgnoreCaseAndStudentId(
            String companyName, Integer studentId);

    // Check duplicate applications belonging to a student
    boolean existsByCompanyNameIgnoreCaseAndRoleIgnoreCaseAndApplicationDateAndStudentId(
            String companyName, String role, LocalDate applicationDate, Integer studentId);

    // Check duplicates while excluding the current placement during editing
    boolean existsByCompanyNameIgnoreCaseAndRoleIgnoreCaseAndApplicationDateAndStudentIdAndIdNot(
            String companyName, String role, LocalDate applicationDate,
            Integer studentId, Integer id);
}

