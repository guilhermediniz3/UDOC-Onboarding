package com.system.UDoc.service;

import com.system.UDoc.dto.StorageInfoDTO;
import com.system.UDoc.entity.GlobalConfig;
import com.system.UDoc.repository.GlobalConfigRepository;
import com.system.UDoc.repository.VideoRecordingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GlobalConfigService {

    /** 10 GB padrão */
    public static final long DEFAULT_STORAGE_LIMIT = 10L * 1024 * 1024 * 1024;
    public static final String KEY_STORAGE_LIMIT   = "storage_gravacoes_limite_bytes";

    private final GlobalConfigRepository configRepo;
    private final VideoRecordingRepository recordingRepo;

    public GlobalConfigService(GlobalConfigRepository configRepo,
                               VideoRecordingRepository recordingRepo) {
        this.configRepo    = configRepo;
        this.recordingRepo = recordingRepo;
    }

    @Transactional(readOnly = true)
    public long getStorageLimitBytes() {
        return configRepo.findByChave(KEY_STORAGE_LIMIT)
                .map(c -> {
                    try { return Long.parseLong(c.getValor()); }
                    catch (NumberFormatException e) { return DEFAULT_STORAGE_LIMIT; }
                })
                .orElse(DEFAULT_STORAGE_LIMIT);
    }

    @Transactional
    public void setStorageLimitBytes(long bytes) {
        GlobalConfig cfg = configRepo.findByChave(KEY_STORAGE_LIMIT)
                .orElse(new GlobalConfig(KEY_STORAGE_LIMIT, null));
        cfg.setValor(String.valueOf(bytes));
        configRepo.save(cfg);
    }

    @Transactional(readOnly = true)
    public long getUsedBytes() {
        Long sum = recordingRepo.sumFileSizes();
        return sum != null ? sum : 0L;
    }

    @Transactional(readOnly = true)
    public StorageInfoDTO getStorageInfo() {
        return new StorageInfoDTO(getStorageLimitBytes(), getUsedBytes());
    }

    /** Lança 403 se a cota estiver esgotada */
    @Transactional(readOnly = true)
    public void checkQuota() {
        long limit = getStorageLimitBytes();
        long used  = getUsedBytes();
        if (used >= limit) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Cota de armazenamento esgotada. Acesse as configurações para liberar espaço ou aumentar a cota.");
        }
    }
}
