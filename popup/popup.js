// Get HTML tags inside the <body> tag of the active tab and handle checkbox events
function getTags() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: () => {
          // Get all tags inside <body>, remove duplicates, and return as an array
          const tags = Array.from(
            new Set([...document.body.querySelectorAll('*')].map((el) => el.tagName.toLowerCase()))
          );
          return tags;
        },
      },
      (results) => {
        try {
          const tags = results[0].result;
          displayTags(tags, tabId);
        } catch (error) {
          displayNoTagsMessage();
        }
      }
    );
  });
}

// Display the tag list and bind click events
function displayTags(tags, tabId) {
  tags.sort();

  const tagList = document.getElementById('tag-list');
  tagList.innerHTML = tags
    .map((tag) => {
      return `
        <li class="tag-item" data-tag="${tag}">
          <span class="tag-name">${tag}</span>
        </li>
      `;
    })
    .join('');

  // Add click event to each li item for highlighting and tooltip
  document.querySelectorAll('.tag-item').forEach((li) => {
    li.addEventListener('click', () => {
      const tag = li.getAttribute('data-tag');
      console.log(`Tag clicked: ${tag}`); // Added log for debugging

      // Highlight or remove highlight based on current state
      if (li.classList.contains('highlighted')) {
        removeHighlight(tag, tabId, li);
        li.classList.remove('highlighted');
      } else {
        highlightTag(tag, tabId, li);
        li.classList.add('highlighted');
      }
    });
  });

  // "Uncheck All" button event
  document.getElementById('uncheck-all').addEventListener('click', () => {
    document.querySelectorAll('.tag-item').forEach((li) => {
      const tag = li.getAttribute('data-tag');
      removeHighlight(tag, tabId, li); // Remove highlight from all tags
      li.classList.remove('highlighted');
    });
  });
}

// Highlight selected tag (change style directly) and display tooltip
function highlightTag(tag, tabId, liElement) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (tagName) => {
      const elements = document.querySelectorAll(tagName);
      elements.forEach((el) => {
        // Set background color and border
        el.style.backgroundColor = 'rgba(128, 128, 128, 0.2)'; // Light gray background
        el.style.border = '2px solid #0091ff'; // Blue border

        // Create tooltip div
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '9999';
        tooltip.style.maxWidth = '200px';
        tooltip.style.whiteSpace = 'normal'; // Allow text wrap
        tooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

        // Display tag name, class, id, and name attributes (in different colors)
        const tagInfo = `
          <span style="color: #ff7f50;">Tag: ${tagName}</span> 
          ${el.className ? `<br><span style="color: #87ceeb;">Class: ${el.className}</span>` : ''}
          ${el.id ? `<br><span style="color: #98fb98;">ID: ${el.id}</span>` : ''}
          ${el.name ? `<br><span style="color: #ffff00;">Name: ${el.name}</span>` : ''}
        `;
        tooltip.innerHTML = tagInfo; // Set innerHTML to apply styles

        // Set tooltip position
        const rect = el.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 30}px`; // Adjust 30px above the element

        // Append tooltip to the body
        document.body.appendChild(tooltip);

        // Remove tooltip on click
        el.addEventListener('click', () => {
          tooltip.remove();
        });
      });
    },
    args: [tag],
  });

  // Change list item style
  liElement.style.backgroundColor = 'rgba(128, 128, 128, 0.2)'; // Light gray background
  liElement.style.border = '2px solid #0091ff'; // Blue border
}

// Remove highlight from the selected tag and reset styles
function removeHighlight(tag, tabId, liElement) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (tagName) => {
      // Remove highlight (reset background color)
      const elements = document.querySelectorAll(tagName);
      elements.forEach((el) => {
        el.style.backgroundColor = ''; // Reset background color
        el.style.border = '';
      });

      // Remove tooltip if it exists for this tag
      const tooltips = document.querySelectorAll('div[style*="position: absolute"]');
      tooltips.forEach((tooltip) => {
        const tooltipText = tooltip.textContent;
        if (tooltipText.includes(tagName)) {
          tooltip.remove();
        }
      });
    },
    args: [tag],
  });

  // Reset list item style
  liElement.style.backgroundColor = ''; // Reset background color
  liElement.style.border = ''; // Reset border
}

// Load tag list when the extension is executed
document.addEventListener('DOMContentLoaded', getTags);
