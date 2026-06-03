package com.system.UDoc.repository;

import com.system.UDoc.entity.PermissionGroup;
import com.system.UDoc.entity.PermissionGroup.GroupType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {
    Optional<PermissionGroup> findByGroupType(GroupType groupType);
}
