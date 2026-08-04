package com.ofss.stock.repository;

import com.ofss.stock.entity.AdminCredential;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminCredentialRepository extends JpaRepository<AdminCredential, String> {
}
