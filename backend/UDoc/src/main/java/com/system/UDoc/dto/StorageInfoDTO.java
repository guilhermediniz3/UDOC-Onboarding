package com.system.UDoc.dto;

public class StorageInfoDTO {
    private long limitBytes;
    private long usedBytes;
    private int pct; // 0-100

    public StorageInfoDTO() {}
    public StorageInfoDTO(long limitBytes, long usedBytes) {
        this.limitBytes = limitBytes;
        this.usedBytes  = usedBytes;
        this.pct = limitBytes > 0 ? (int) Math.min(100, usedBytes * 100L / limitBytes) : 0;
    }

    public long getLimitBytes() { return limitBytes; }
    public long getUsedBytes()  { return usedBytes;  }
    public int  getPct()        { return pct;        }
    public void setLimitBytes(long v) { this.limitBytes = v; }
    public void setUsedBytes(long v)  { this.usedBytes  = v; }
    public void setPct(int v)         { this.pct = v;        }
}
