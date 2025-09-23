package com.example.datn.service;

import com.example.datn.dto.ChatLieuDTO;
import com.example.datn.dto.PhieuGiamGiaDTO;
import com.example.datn.entity.ChatLieu;
import com.example.datn.exception.AppException;
import com.example.datn.exception.ErrorCode;
import com.example.datn.repository.ChatLieuRepository;
import com.example.datn.vo.chatLieuVO.ChatLieuQueryVO;
import com.example.datn.vo.chatLieuVO.ChatLieuUpdateVO;
import com.example.datn.vo.chatLieuVO.ChatLieuVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatLieuService {

    @Autowired
    private ChatLieuRepository chatLieuRepository;

    @Caching(evict = {
            @CacheEvict(value = "chatLieu", allEntries = true),
            @CacheEvict(value = "chatLieuPage", allEntries = true)
    })
    public ChatLieuDTO save(ChatLieuVO vO) {
        // Kiểm tra trống
        if (vO.getTenChatLieu() == null || vO.getTenChatLieu().trim().isEmpty()) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenChatLieu().length() > 50) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_TOO_LONG,
                    ErrorCode.CHATLIEU_NAME_TOO_LONG.getErrorMessage(50));
        }
        // Kiểm tra trùng tên
        if (chatLieuRepository.existsByTenChatLieu(vO.getTenChatLieu().trim())) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_DUPLICATE);
        }

        Integer maxCode = chatLieuRepository.findMaxMaChatLieuCode();
        int nextCode = (maxCode != null ? maxCode : 0) + 1;
        String maChatLieu = String.format("CL%04d", nextCode);

        ChatLieu bean = new ChatLieu();

        if ( chatLieuRepository.existsByTenChatLieu(vO.getTenChatLieu())){
            throw new AppException(ErrorCode.THE_material_ALREADY_EXISTS);
        }
        BeanUtils.copyProperties(vO, bean);
        bean.setMaChatLieu(maChatLieu);
        bean.setTrangThai(1);
        bean = chatLieuRepository.save(bean);

        // Trả về DTO luôn, hoặc nếu muốn trả về id thì return bean.getId();
        ChatLieuDTO dto = new ChatLieuDTO();
        BeanUtils.copyProperties(bean, dto);
        return dto;
    }

    @Caching(evict = {
            @CacheEvict(value = "chatLieu", allEntries = true),
            @CacheEvict(value = "chatLieuPage", allEntries = true)
    })
    public void delete(Integer id) {
        if (!chatLieuRepository.existsById(id)) {
            throw new AppException(ErrorCode.CHATLIEU_NOT_FOUND);
        }
        chatLieuRepository.deleteById(id);
    }

    @Caching(evict = {
            @CacheEvict(value = "chatLieu", allEntries = true),
            @CacheEvict(value = "chatLieuPage", allEntries = true)
    })
    public void update(Integer id, ChatLieuUpdateVO vO) {
        ChatLieu bean = requireOne(id);
        // Kiểm tra trống
        if (vO.getTenChatLieu() == null || vO.getTenChatLieu().trim().isEmpty()) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_EMPTY);
        }
        // Kiểm tra quá ký tự
        if (vO.getTenChatLieu().length() > 50) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_TOO_LONG,
                    String.format(ErrorCode.CHATLIEU_NAME_TOO_LONG.getErrorMessage(), 50));
        }
        // Kiểm tra trùng tên (trừ chính bản ghi đang sửa)
        String newName = vO.getTenChatLieu().trim();
        if (chatLieuRepository.existsByTenChatLieu(newName)
                && !bean.getTenChatLieu().equalsIgnoreCase(newName)) {
            throw new AppException(ErrorCode.CHATLIEU_NAME_DUPLICATE);
        }
        BeanUtils.copyProperties(vO, bean);
        chatLieuRepository.save(bean);
    }

    @Cacheable(value = "chatLieu", key = "#id")
    public ChatLieuDTO getById(Integer id) {
        ChatLieu original = requireOne(id);
        return toDTO(original);
    }

    // Cache phân trang từng trang riêng, key dựa vào các tham số của query
    @Cacheable(value = "chatLieuPage", key = "#vO.pageNumber + '-' + #vO.pageSize + '-' + #vO.tenChatLieu + '-' + #vO.maChatLieu + '-' + #vO.trangThai")
    public Page<ChatLieuDTO> query(ChatLieuQueryVO vO) {
        int page = vO.getPageNumber() != null ? vO.getPageNumber() : 0;
        int size = vO.getPageSize() != null ? vO.getPageSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Page<ChatLieu> entities = chatLieuRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();

            if (vO.getTenChatLieu() != null && !vO.getTenChatLieu().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("tenChatLieu")), "%" + vO.getTenChatLieu().toLowerCase() + "%"));
            }
            if (vO.getMaChatLieu() != null && !vO.getMaChatLieu().isEmpty()) {
                predicates = cb.and(predicates,
                        cb.like(cb.lower(root.get("maChatLieu")), "%" + vO.getMaChatLieu().toLowerCase() + "%"));
            }
            if (vO.getTrangThai() != null) {
                predicates = cb.and(predicates, cb.equal(root.get("trangThai"), vO.getTrangThai()));
            }
            return predicates;
        }, pageable);

        return entities.map(this::toDTO);
    }

    // Thêm hàm lấy tất cả chất liệu cho FE select động
    @Cacheable(value = "chatLieu", key = "'all'")
    public List<ChatLieuDTO> findAll() {
        return chatLieuRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ChatLieuDTO toDTO(ChatLieu original) {
        ChatLieuDTO bean = new ChatLieuDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private ChatLieu requireOne(Integer id) {
        return chatLieuRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHATLIEU_NOT_FOUND));
    }
}