/**
 * OphthaCare 2.0 - Clinical Doctor Workstation Client Controller
 */

const state = {
  activeTab: 'tab-preop',
  patients: [],
  selectedPatient: null,
  orRooms: [],
  currentApiEndpoint: 'patients'
};

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPatientDropdown();
  initIOLCalculator();
  initApiExplorer();
  loadInitialData();
});

// Tab Switcher
function initTabs() {
  const tabs = document.querySelectorAll('.role-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
      state.activeTab = targetId;
    });
  });
}

// Initial Data Loading
async function loadInitialData() {
  try {
    const res = await fetch('/api/patients');
    const data = await res.json();
    if (data.success && data.patients.length > 0) {
      state.patients = data.patients;
      populatePatientDropdown();
      selectPatient(data.patients[0].patuuid);
    }

    const orRes = await fetch('/api/or-rooms');
    const orData = await orRes.json();
    if (orData.success) {
      state.orRooms = orData.rooms;
      renderOrRooms();
    }
  } catch (err) {
    console.warn('Initial data load error:', err);
  }
}

function initPatientDropdown() {
  const select = document.getElementById('patientSelect');
  if (select) {
    select.addEventListener('change', (e) => {
      selectPatient(e.target.value);
    });
  }
}

function populatePatientDropdown() {
  const select = document.getElementById('patientSelect');
  if (!select) return;

  select.innerHTML = state.patients.map(p => 
    `<option value="${p.patuuid}">${p.lastName}${p.firstName} (${p.mrn}) - ${p.diagnosis.split(' (')[0]}</option>`
  ).join('');
}

function selectPatient(patuuid) {
  const patient = state.patients.find(p => p.patuuid === patuuid);
  if (!patient) return;
  state.selectedPatient = patient;

  // 1. Update Demographic Banner
  document.getElementById('pAvatar').textContent = patient.lastName;
  document.getElementById('pFullName').textContent = patient.name;
  document.getElementById('pMrn').textContent = patient.mrn;
  document.getElementById('pAge').textContent = patient.age;
  document.getElementById('pGender').textContent = patient.gender === 'MALE' ? '男 (Male)' : '女 (Female)';
  document.getElementById('pBday').textContent = patient.birthday;
  document.getElementById('pTel').textContent = patient.tel;
  document.getElementById('pAllergies').textContent = patient.allergies || '無已知過敏';
  document.getElementById('pDiseases').textContent = patient.systemicDiseases.join(', ') || '無重大慢性病';

  const statusBadge = document.getElementById('pStatusBadge');
  if (statusBadge) {
    const statusMap = {
      'POST_OP': '術後恢復中 (Post-Op)',
      'IN_PREP': '術前準備中 (In Prep)',
      'WAITING_ASSESSMENT': '評估評估中 (Pre-Op)'
    };
    statusBadge.textContent = statusMap[patient.status] || patient.status;
  }

  // 2. Update OD Right Eye Pre-Op
  const od = patient.preOp.od;
  if (od) {
    document.getElementById('odUcva').textContent = od.ucva;
    document.getElementById('odBcva').textContent = od.bcva;
    document.getElementById('odRefraction').textContent = `${od.sphere} D / ${od.cylinder} D × ${od.axis}°`;
    document.getElementById('odSE').textContent = `${od.sphericalEquivalent > 0 ? '+' : ''}${od.sphericalEquivalent} D`;
    document.getElementById('odIop').textContent = `${od.iop} mmHg`;
    document.getElementById('odCct').textContent = `${od.cct} μm`;
    document.getElementById('odK').textContent = `${od.k1.toFixed(2)} D / ${od.k2.toFixed(2)} D`;
    document.getElementById('odAL').textContent = `${od.axialLength.toFixed(2)} mm`;
    document.getElementById('odAcd').textContent = `${od.anteriorChamberDepth ? od.anteriorChamberDepth.toFixed(2) : '-'} mm`;

    // Pre-fill IOL Calculator
    document.getElementById('calcAL').value = od.axialLength;
    document.getElementById('calcK1').value = od.k1;
    document.getElementById('calcK2').value = od.k2;
    document.getElementById('calcAConst').value = od.aConstant || 118.9;
    runIOLCalculation();
  }

  // 3. Update OS Left Eye Pre-Op
  const os = patient.preOp.os;
  if (os) {
    document.getElementById('osUcva').textContent = os.ucva;
    document.getElementById('osBcva').textContent = os.bcva;
    document.getElementById('osRefraction').textContent = `${os.sphere} D / ${os.cylinder} D × ${os.axis}°`;
    document.getElementById('osSE').textContent = `${os.sphericalEquivalent > 0 ? '+' : ''}${os.sphericalEquivalent} D`;
    document.getElementById('osIop').textContent = `${os.iop} mmHg`;
    document.getElementById('osCct').textContent = `${os.cct} μm`;
    document.getElementById('osK').textContent = `${os.k1.toFixed(2)} D / ${os.k2.toFixed(2)} D`;
    document.getElementById('osAL').textContent = `${os.axialLength.toFixed(2)} mm`;
    document.getElementById('osAcd').textContent = `${os.anteriorChamberDepth ? os.anteriorChamberDepth.toFixed(2) : '-'} mm`;
  }

  // 4. Update Surgery Record
  const surg = patient.surgery;
  if (surg) {
    document.getElementById('surgCaseId').textContent = surg.caseId;
    document.getElementById('surgRoom').textContent = surg.orRoom;
    document.getElementById('surgTargetEye').textContent = surg.targetEye;
    document.getElementById('surgDoctor').textContent = surg.surgeon;
    document.getElementById('surgProcedure').textContent = surg.procedure;
    document.getElementById('surgAnesthesia').textContent = surg.anesthesia;
    document.getElementById('surgPhacoTime').textContent = surg.phacoTimeSec ? `${surg.phacoTimeSec} 秒 (CDE: ${surg.cdeEnergy})` : 'N/A (雷射術式)';
    document.getElementById('surgImplantedIOL').textContent = surg.implantedIOL ? `${surg.implantedIOL.model} (${surg.implantedIOL.powerD})` : 'N/A (非植入術式)';
    document.getElementById('surgComplications').textContent = surg.complications;
  }

  // 5. Update Post-Op Follow-up Table
  const tbody = document.getElementById('postOpTableBody');
  if (tbody) {
    if (patient.postOp && patient.postOp.followUps && patient.postOp.followUps.length > 0) {
      tbody.innerHTML = patient.postOp.followUps.map(f => `
        <tr>
          <td><strong style="color:#0ea5e9;">${f.day}</strong></td>
          <td class="font-mono">${f.date}</td>
          <td class="font-mono">${f.ucva}</td>
          <td class="font-mono text-teal">${f.bcva}</td>
          <td class="font-mono text-emerald">${f.iop} mmHg</td>
          <td><span class="badge badge-emerald">${f.woundSeal}</span></td>
          <td>${f.notes}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px;">該患者尚未執行手術或尚未有回診紀錄</td></tr>`;
    }
  }
}

/* ==========================================================================
   SRK/T IOL Calculator Logic
   ========================================================================== */
function initIOLCalculator() {
  const btn = document.getElementById('btnCalculateIOL');
  if (btn) {
    btn.addEventListener('click', runIOLCalculation);
  }
}

async function runIOLCalculation() {
  const al = parseFloat(document.getElementById('calcAL').value);
  const k1 = parseFloat(document.getElementById('calcK1').value);
  const k2 = parseFloat(document.getElementById('calcK2').value);
  const aConst = parseFloat(document.getElementById('calcAConst').value) || 118.9;
  const target = parseFloat(document.getElementById('calcTarget').value) || 0.0;

  if (isNaN(al) || isNaN(k1) || isNaN(k2)) return;

  try {
    const res = await fetch('/api/calculate-iol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ axialLength: al, k1, k2, aConstant: aConst, targetRefraction: target })
    });
    const data = await res.json();
    if (data.success) {
      renderIOLResults(data.calculation);
    }
  } catch (err) {
    console.warn('IOL calculation error:', err);
  }
}

function renderIOLResults(calc) {
  const powerEl = document.getElementById('resIOLPower');
  if (powerEl) {
    powerEl.innerHTML = `+${calc.recommendedIOLPowerD.toFixed(1)} <span class="unit">D</span>`;
  }

  const stepsGrid = document.getElementById('iolStepsGrid');
  if (stepsGrid && calc.availableSteps) {
    stepsGrid.innerHTML = calc.availableSteps.map(step => {
      const isTarget = step.power === calc.recommendedIOLPowerD;
      return `
        <div class="step-card ${isTarget ? 'active' : ''}">
          <div class="step-power">+${step.power.toFixed(1)} D</div>
          <div class="step-pred font-mono">${step.predictedRefraction > 0 ? '+' : ''}${step.predictedRefraction.toFixed(2)} D</div>
        </div>
      `;
    }).join('');
  }
}

/* ==========================================================================
   Operating Rooms Board
   ========================================================================== */
function renderOrRooms() {
  const grid = document.getElementById('orRoomsGrid');
  if (!grid) return;

  grid.innerHTML = state.orRooms.map(room => {
    const isOccupied = room.status === 'IN_SURGERY';
    const badgeClass = isOccupied ? 'badge-amber' : (room.status === 'CLEANING' ? 'badge-teal' : 'badge-emerald');
    const statusText = isOccupied ? '● 手術進行中' : (room.status === 'CLEANING' ? '▲ 消毒準備中' : '○ 空閒備用');

    return `
      <div class="or-room-card ${room.status.toLowerCase()}">
        <div class="or-room-header">
          <span class="or-room-name">${room.name}</span>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <div class="or-case-name"><strong>當前排程:</strong> ${room.currentCase}</div>
        <div class="or-surgeon"><strong>主刀醫師:</strong> ${room.surgeon}</div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   API Explorer Console
   ========================================================================== */
const API_SPECS = {
  patients: {
    method: 'GET',
    url: '/api/patients',
    desc: '取得全院眼科患者名冊及其完整圍手術期狀態。',
    hasBody: false
  },
  singlePatient: {
    method: 'GET',
    url: '/api/patients/PAT-2026-001',
    desc: '查詢指定病患之完整病歷資料、雙眼 OD/OS 檢查數據、手術參數與術後回診歷程。',
    hasBody: false
  },
  calcIol: {
    method: 'POST',
    url: '/api/calculate-iol',
    desc: '傳送眼軸長度 (AL) 與角膜曲率 (K1, K2)，系統即時透過 SRK/T 公式試算建議水晶體度數與屈光預測表。',
    hasBody: true,
    defaultBody: JSON.stringify({
      axialLength: 23.82,
      k1: 43.50,
      k2: 44.25,
      aConstant: 118.9,
      targetRefraction: 0.00
    }, null, 2)
  },
  correctIop: {
    method: 'POST',
    url: '/api/correct-iop',
    desc: '以中央角膜厚度 (CCT) 依據 Dresdner/Ehlers 演算法校正眼壓實測值，辨識偽低眼壓與青光眼風險。',
    hasBody: true,
    defaultBody: JSON.stringify({
      measuredIOP: 22.5,
      cctMicrons: 510
    }, null, 2)
  },
  orRooms: {
    method: 'GET',
    url: '/api/or-rooms',
    desc: '獲取全院 3 間眼科專屬手術室即時運作狀態與主刀醫師排程看板。',
    hasBody: false
  },
  stats: {
    method: 'GET',
    url: '/api/stats/clinical',
    desc: '統計臨床總病患量、術前/術中/術後各階段分佈與手術室稼動率。',
    hasBody: false
  }
};

function initApiExplorer() {
  const items = document.querySelectorAll('.api-item');
  const runBtn = document.getElementById('btnRunApi');

  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      state.currentApiEndpoint = item.getAttribute('data-endpoint');
      renderApiDetails();
    });
  });

  if (runBtn) {
    runBtn.addEventListener('click', executeActiveApi);
  }

  renderApiDetails();
}

function renderApiDetails() {
  const spec = API_SPECS[state.currentApiEndpoint];
  if (!spec) return;

  document.getElementById('activeApiMethod').textContent = spec.method;
  document.getElementById('activeApiMethod').className = `http-badge ${spec.method.toLowerCase()}`;
  document.getElementById('activeApiUrl').textContent = spec.url;
  document.getElementById('activeApiDesc').textContent = spec.desc;

  const reqBox = document.getElementById('apiReqBox');
  const payloadEl = document.getElementById('apiReqPayload');

  if (spec.hasBody) {
    reqBox.style.display = 'block';
    payloadEl.value = spec.defaultBody;
  } else {
    reqBox.style.display = 'none';
  }
}

async function executeActiveApi() {
  const spec = API_SPECS[state.currentApiEndpoint];
  if (!spec) return;

  const outEl = document.getElementById('apiResponseOutput');
  const statusEl = document.getElementById('apiStatusBadge');
  outEl.textContent = '發送臨床 API 請求中...';

  const startTime = performance.now();
  try {
    const options = { method: spec.method, headers: {} };
    if (spec.hasBody) {
      options.headers['Content-Type'] = 'application/json';
      options.body = document.getElementById('apiReqPayload').value;
    }

    const res = await fetch(spec.url, options);
    const duration = Math.round(performance.now() - startTime);
    const json = await res.json();

    statusEl.textContent = `${res.status} ${res.statusText || 'OK'} • ${duration}ms`;
    statusEl.className = 'badge ' + (res.ok ? 'badge-emerald' : 'badge-amber');
    outEl.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    statusEl.textContent = `Error • ${duration}ms`;
    statusEl.className = 'badge badge-amber';
    outEl.textContent = JSON.stringify({ error: err.message }, null, 2);
  }
}
