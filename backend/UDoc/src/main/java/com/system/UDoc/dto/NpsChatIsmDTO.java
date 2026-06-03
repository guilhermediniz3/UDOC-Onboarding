package com.system.UDoc.dto;

import java.util.Map;

public class NpsChatIsmDTO {
    private Long   ismId;
    private String ismNome;
    private String ismFoto;
    private long   nota1; // Ruim
    private long   nota2; // Regular
    private long   nota3; // Bom
    private long   nota4; // Muito satisfeito
    private long   total;

    public NpsChatIsmDTO() {}

    public static NpsChatIsmDTO fromRow(Map<String, Object> row) {
        NpsChatIsmDTO dto = new NpsChatIsmDTO();
        dto.ismId   = toLong(row.get("ismid"));
        dto.ismNome = (String) row.get("ismnome");
        dto.ismFoto = (String) row.get("ismfoto");
        dto.nota1   = toLong(row.get("nota1"));
        dto.nota2   = toLong(row.get("nota2"));
        dto.nota3   = toLong(row.get("nota3"));
        dto.nota4   = toLong(row.get("nota4"));
        dto.total   = toLong(row.get("total"));
        return dto;
    }

    private static long toLong(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number) return ((Number) v).longValue();
        return Long.parseLong(v.toString());
    }

    public Long   getIsmId()   { return ismId; }
    public String getIsmNome() { return ismNome; }
    public String getIsmFoto() { return ismFoto; }
    public long   getNota1()   { return nota1; }
    public long   getNota2()   { return nota2; }
    public long   getNota3()   { return nota3; }
    public long   getNota4()   { return nota4; }
    public long   getTotal()   { return total; }
}
