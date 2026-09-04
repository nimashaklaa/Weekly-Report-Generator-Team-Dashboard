package com.example.backend.notification.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.notification.dto.NotificationResponse;
import com.example.backend.notification.model.Notification;
import com.example.backend.notification.repository.NotificationRepository;
import com.example.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(User currentUser, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedDateDesc(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User currentUser) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(currentUser.getId());
    }

    public NotificationResponse markAsRead(Integer id, User currentUser) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Notification not found");
        }
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        return toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(User currentUser) {
        notificationRepository
                .findByRecipientIdOrderByCreatedDateDesc(currentUser.getId(), Pageable.unpaged())
                .forEach(n -> {
                    if (!n.isRead()) {
                        n.setRead(true);
                        n.setReadAt(LocalDateTime.now());
                        notificationRepository.save(n);
                    }
                });
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .relatedReportId(n.getRelatedReport() != null ? n.getRelatedReport().getId() : null)
                .isRead(n.isRead())
                .readAt(n.getReadAt())
                .createdDate(n.getCreatedDate())
                .build();
    }
}