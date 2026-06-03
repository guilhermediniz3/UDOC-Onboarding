package com.system.UDoc.repository;

import com.system.UDoc.entity.Permission;
import com.system.UDoc.entity.PermissionGroup;
import com.system.UDoc.entity.PermissionGroup.GroupType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    List<Permission> findByGroupGroupType(GroupType groupType);

    List<Permission> findAllByOrderByModuleAscActionAsc();

    @Query("SELECT p FROM Permission p WHERE p.group.groupType = :gt AND p.module = :mod AND p.action = :act")
    Optional<Permission> findByGroupTypeModuleAction(
            @Param("gt")  GroupType groupType,
            @Param("mod") String module,
            @Param("act") String action);

    boolean existsByGroupAndModuleAndAction(PermissionGroup group, String module, String action);
}
