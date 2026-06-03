package com.system.UDoc.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Classe base de auditoria para todas as entidades de domínio.
 * Preenche automaticamente createdAt/updatedAt/createdBy/lastModifiedBy
 * via Spring Data JPA Auditing.
 * deletedAt e deletedBy são preenchidos manualmente pelo service ao fazer soft delete.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(updatable = false, length = 255)
    private String createdBy;

    @LastModifiedBy
    @Column(length = 255)
    private String lastModifiedBy;

    @Column
    private LocalDateTime deletedAt;

    @Column(length = 255)
    private String deletedBy;

    public LocalDateTime getCreatedAt()       { return createdAt; }
    public LocalDateTime getUpdatedAt()       { return updatedAt; }
    public String        getCreatedBy()       { return createdBy; }
    public String        getLastModifiedBy()  { return lastModifiedBy; }
    public LocalDateTime getDeletedAt()       { return deletedAt; }
    public void          setDeletedAt(LocalDateTime v) { this.deletedAt = v; }
    public String        getDeletedBy()       { return deletedBy; }
    public void          setDeletedBy(String v)        { this.deletedBy = v; }
    public boolean       isDeleted()          { return deletedAt != null; }
}
