document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('active');
        
        // Close other open FAQs
        document.querySelectorAll('.faq-item').forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });
      });
    });

    // Simple search functionality
    const searchInput = document.querySelector('.search-support input');
    searchInput.addEventListener('keyup', () => {
      const searchTerm = searchInput.value.toLowerCase();
      
      document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.style.display = 'block';
          item.classList.add('active'); // Expand if match found
        } else {
          item.style.display = 'none';
        }
      });
    });

    // Support card click handlers
    document.querySelectorAll('.support-card').forEach(card => {
      card.addEventListener('click', () => {
        const cardTitle = card.querySelector('h3').textContent;
        alert(`You selected: ${cardTitle}. This would navigate to the appropriate section.`);
      });
    });