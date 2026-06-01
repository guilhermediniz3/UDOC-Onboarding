package com.system.UDoc.repository;
import com.system.UDoc.entity.CardQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface CardQuestionRepository extends JpaRepository<CardQuestion, Long> {
    List<CardQuestion> findByCardIdOrderByOrdemAsc(Long cardId);
    @Modifying @Query("DELETE FROM CardQuestion q WHERE q.card.id = :cardId")
    void deleteByCardId(@Param("cardId") Long cardId);
    @Query("SELECT COALESCE(SUM(q.pontos),0.0) FROM CardQuestion q WHERE q.card.id = :cardId")
    Double sumPontosByCardId(@Param("cardId") Long cardId);
}
