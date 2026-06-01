package com.system.UDoc.controller;

import com.system.UDoc.dto.MyTrailContentItemDTO;
import com.system.UDoc.dto.TrailDTO;
import com.system.UDoc.entity.User;
import com.system.UDoc.service.MyTrailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/my-trails")
public class MyTrailsController {

    private final MyTrailsService myTrailsService;

    public MyTrailsController(MyTrailsService myTrailsService) {
        this.myTrailsService = myTrailsService;
    }

    @GetMapping
    public ResponseEntity<List<TrailDTO>> getMyTrails(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(myTrailsService.getMyTrails(user.getId()));
    }

    @GetMapping("/{trailId}/content")
    public ResponseEntity<List<MyTrailContentItemDTO>> getTrailContent(
            @AuthenticationPrincipal User user,
            @PathVariable Long trailId
    ) {
        return ResponseEntity.ok(myTrailsService.getTrailContent(user.getId(), trailId));
    }
}
