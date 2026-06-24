// ============================================================
// Componente de Videollamada con Jitsi Meet
// ============================================================

export function createJitsiMeeting(containerId, roomName, displayName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const domain = 'meet.jit.si';
  const iframe = document.createElement('iframe');
  iframe.src = `https://${domain}/${roomName}#userInfo.displayName=${encodeURIComponent(displayName)}&config.prejoinPageEnabled=false`;
  iframe.style.cssText = 'width: 100%; height: 80vh; border: none; border-radius: 8px;';
  iframe.allow = 'camera; microphone; fullscreen; display-capture';
  container.innerHTML = '';
  container.appendChild(iframe);

  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'Salir de la videollamada';
  exitBtn.style.cssText = 'margin-top: 10px; padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer;';
  exitBtn.addEventListener('click', () => {
    container.innerHTML = '<p>Videollamada finalizada.</p>';
  });
  container.appendChild(exitBtn);
}