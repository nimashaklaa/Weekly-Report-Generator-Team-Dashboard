package com.example.backend.notification.repository;

import com.example.backend.notification.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    Page<Notification> findByRecipientIdOrderByCreatedDateDesc(Integer recipientId, Pageable pageable);
    long countByRecipientIdAndIsReadFalse(Integer recipientId);
}