package com.system.UDoc.repository;

import com.system.UDoc.entity.UserTrailProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserTrailProgressRepository extends JpaRepository<UserTrailProgress, Long> {

    Optional<UserTrailProgress> findByUserIdAndTrailId(Long userId, Long trailId);

    @Query("SELECT p FROM UserTrailProgress p WHERE p.user.id IN :userIds AND p.trailId = :trailId")
    List<UserTrailProgress> findByUserIdInAndTrailId(
            @Param("userIds") List<Long> userIds,
            @Param("trailId") Long trailId
    );

    List<UserTrailProgress> findByUserIdAndCertifiedTrue(Long userId);
}
