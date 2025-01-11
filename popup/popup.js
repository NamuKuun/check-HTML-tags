// 활성 탭에서 body 태그 내부의 HTML 태그 가져오기 및 체크박스 이벤트 처리
function getTags() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: () => {
          // <body> 내부의 모든 태그를 가져오고, 중복을 제거한 후 배열로 반환
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
// 태그 목록 표시 및 클릭 이벤트 연결
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

  // li 클릭 시 태그 강조 표시 및 말풍선 표시
  document.querySelectorAll('.tag-item').forEach((li) => {
    li.addEventListener('click', () => {
      const tag = li.getAttribute('data-tag');
      console.log(`Tag clicked: ${tag}`); // 로그 추가

      // 현재 상태에 따라 강조 표시 또는 해제
      if (li.classList.contains('highlighted')) {
        removeHighlight(tag, tabId, li);
        li.classList.remove('highlighted');
      } else {
        highlightTag(tag, tabId, li);
        li.classList.add('highlighted');
      }
    });
  });

  // 전체 해제 버튼
  document.getElementById('uncheck-all').addEventListener('click', () => {
    document.querySelectorAll('.tag-item').forEach((li) => {
      const tag = li.getAttribute('data-tag');
      removeHighlight(tag, tabId, li); // 모든 태그 강조 해제
      li.classList.remove('highlighted');
    });
  });
}
// 선택된 태그를 강조 표시 (스타일 직접 변경) 및 말풍선 표시
function highlightTag(tag, tabId, liElement) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (tagName) => {
      const elements = document.querySelectorAll(tagName);
      elements.forEach((el) => {
        // 배경색과 테두리 설정
        el.style.backgroundColor = 'rgba(128, 128, 128, 0.2)'; // 얇은 회색 배경
        el.style.border = '2px solid #0091ff'; // 파란색 테두리

        // 말풍선 div 생성
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '9999';
        tooltip.style.maxWidth = '200px';
        tooltip.style.whiteSpace = 'normal'; // 줄 바꿈을 허용
        tooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

        // 태그명, 클래스명, id, name 속성 표시 (각각 다른 색상)
        const tagInfo = `
          <span style="color: #ff7f50;">Tag: ${tagName}</span> 
          ${el.className ? `<br><span style="color: #87ceeb;">Class: ${el.className}</span>` : ''}
          ${el.id ? `<br><span style="color: #98fb98;">ID: ${el.id}</span>` : ''}
          ${el.name ? `<br><span style="color: #ffff00;">Name: ${el.name}</span>` : ''}
        `;
        tooltip.innerHTML = tagInfo; // innerHTML로 삽입하여 스타일 적용

        // 말풍선 위치 설정
        const rect = el.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 30}px`; // 위로 30px 떨어지게 위치 조정

        // body에 말풍선 추가
        document.body.appendChild(tooltip);

        // 말풍선 클릭 시 제거
        el.addEventListener('click', () => {
          tooltip.remove();
        });
      });
    },
    args: [tag],
  });

  // 목록 항목 스타일 변경
  liElement.style.backgroundColor = 'rgba(128, 128, 128, 0.2)'; // 얇은 회색 배경
  liElement.style.border = '2px solid #0091ff'; // 파란색 테두리
}

// 선택된 태그에서 강조 제거 및 스타일 원래대로 돌리기
function removeHighlight(tag, tabId, liElement) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (tagName) => {
      // 강조 제거 (배경색 초기화)
      const elements = document.querySelectorAll(tagName);
      elements.forEach((el) => {
        el.style.backgroundColor = ''; // 기존 배경색 초기화
        el.style.border = '';
      });

      // 해당 태그의 말풍선이 있다면 제거
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

  // 목록 항목 스타일 원래대로 복원
  liElement.style.backgroundColor = ''; // 배경색 초기화
  liElement.style.border = ''; // 테두리 초기화
}

// 확장 프로그램 실행 시 태그 목록 로드
document.addEventListener('DOMContentLoaded', getTags);
