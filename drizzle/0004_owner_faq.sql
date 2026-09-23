-- Retire saved versions of the five placeholder FAQs without deleting admin history.
UPDATE faqs SET published=0 WHERE id IN ('consultation','touchup','previous','confirmation','change');
