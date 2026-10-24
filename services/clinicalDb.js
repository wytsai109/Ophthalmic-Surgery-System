/**
 * OphthaCare 2.0 - In-Memory Clinical Database & Registry
 * 
 * Manages:
 * - Patient Demographics & Medical History
 * - Pre-Operative Assessment Records (OD Right Eye & OS Left Eye)
 * - Surgical Case Logs (Intra-operative metrics, laser/phaco parameters)
 * - Post-Operative Clinical Follow-ups (Visual recovery & IOP timeline)
 * - Operating Room (OR) Live Schedule
 */

import { calculateIOLPower, calculateSphericalEquivalent, correctIOPbyCCT } from './ophthalmicEngine.js';

const INITIAL_PATIENTS = [
  {
    patuuid: 'PAT-2026-001',
    mrn: 'MRN-880291',
    firstName: '建明',
    lastName: '王',
    name: '王建明 (Wang, Jian-Ming)',
    gender: 'MALE',
    birthday: '1958-04-12',
    age: 68,
    tel: '0912-334-556',
    allergies: 'Penicillin (盤尼西林過敏)',
    systemicDiseases: ['高血壓 (HTN)', '第二型糖尿病 (Type 2 DM)'],
    diagnosis: '老年性皮質型白內障 (Senile Cortical Cataract, OD > OS)',
    status: 'POST_OP',
    assignedSurgeon: '林憲銘 主任醫師 (Dr. Lin, Hsien-Ming)',
    preOp: {
      examDate: '2026-10-18',
      asaClass: 'ASA II',
      // OD - Right Eye (Operating Eye)
      od: {
        eye: 'OD',
        ucva: '0.1',
        bcva: '0.2',
        sphere: '+1.50',
        cylinder: '-1.25',
        axis: '90',
        sphericalEquivalent: 0.88,
        iop: 16.5,
        cct: 548,
        k1: 43.50,
        k2: 44.25,
        axialLength: 23.82,
        corneaStatus: 'Clear, no dystrophy',
        anteriorChamberDepth: 3.25,
        iolModel: 'Alcon AcrySof IQ (SN60WF)',
        aConstant: 118.9,
        calculatedIOLPowerD: 21.0
      },
      // OS - Left Eye
      os: {
        eye: 'OS',
        ucva: '0.4',
        bcva: '0.7',
        sphere: '+0.75',
        cylinder: '-0.75',
        axis: '85',
        sphericalEquivalent: 0.38,
        iop: 15.0,
        cct: 550,
        k1: 43.75,
        k2: 44.00,
        axialLength: 23.70,
        corneaStatus: 'Clear',
        anteriorChamberDepth: 3.20,
        iolModel: 'Pending OS evaluation',
        aConstant: 118.9,
        calculatedIOLPowerD: 21.5
      }
    },
    surgery: {
      caseId: 'SURG-2026-101',
      orRoom: 'OR-1 (微創眼科專屬手術室)',
      surgeryDate: '2026-10-24',
      targetEye: 'OD (右眼)',
      procedure: '超音波晶體乳化術併人工水晶體植入 (Phacoemulsification + IOL Implantation)',
      surgeon: '林憲銘 主任醫師',
      anesthesia: '局部滴眼麻醉 (Topical Alcaine 0.5%)',
      phacoTimeSec: 42,
      cdeEnergy: 6.8,
      implantedIOL: {
        model: 'Alcon AcrySof IQ Monofocal',
        powerD: '+21.0 D',
        sn: 'SN-994821-TW'
      },
      complications: 'None (順利無術中併發症)',
      status: 'COMPLETED'
    },
    postOp: {
      followUps: [
        { day: 'Day 1 (術後第 1 天)', date: '2026-10-25', ucva: '0.8', bcva: '0.9', iop: 15.2, woundSeal: 'Seidel (-), Intact', notes: '角膜清澈，前房輕微浮游物，水晶體居中' },
        { day: 'Week 1 (術後第 1 週)', date: '2026-11-01', ucva: '0.9', bcva: '1.0', iop: 14.5, woundSeal: 'Healed', notes: '視力大幅改善，生活自理良好' },
        { day: 'Month 1 (術後第 1 個月)', date: '2026-11-24', ucva: '1.0', bcva: '1.2', iop: 14.0, woundSeal: 'Fully Healed', notes: '雙眼立體感優異，順利結案' }
      ]
    }
  },
  {
    patuuid: 'PAT-2026-002',
    mrn: 'MRN-910482',
    firstName: '佩珊',
    lastName: '李',
    name: '李佩珊 (Lee, Pei-Shan)',
    gender: 'FEMALE',
    birthday: '1998-09-22',
    age: 28,
    tel: '0933-778-899',
    allergies: 'NKDA (無已知藥物過敏)',
    systemicDiseases: ['無全身性慢性病'],
    diagnosis: '雙眼高度近視併規則散光 (High Myopia with Astigmatism, OU)',
    status: 'IN_PREP',
    assignedSurgeon: '陳美娟 醫師 (Dr. Chen, Mei-Chuan)',
    preOp: {
      examDate: '2026-10-23',
      asaClass: 'ASA I',
      od: {
        eye: 'OD',
        ucva: '0.05',
        bcva: '1.0',
        sphere: '-6.50',
        cylinder: '-1.50',
        axis: '175',
        sphericalEquivalent: -7.25,
        iop: 14.0,
        cct: 558,
        k1: 42.75,
        k2: 44.25,
        axialLength: 26.15,
        corneaStatus: 'PentaCam Topography Normal, Keratoconus screen negative',
        anteriorChamberDepth: 3.65
      },
      os: {
        eye: 'OS',
        ucva: '0.05',
        bcva: '1.0',
        sphere: '-6.00',
        cylinder: '-1.25',
        axis: '180',
        sphericalEquivalent: -6.62,
        iop: 14.5,
        cct: 554,
        k1: 43.00,
        k2: 44.10,
        axialLength: 25.98,
        corneaStatus: 'Normal Topography',
        anteriorChamberDepth: 3.60
      }
    },
    surgery: {
      caseId: 'SURG-2026-102',
      orRoom: 'OR-2 (飛秒屈光雷射中心)',
      surgeryDate: '2026-10-24',
      targetEye: 'OU (雙眼)',
      procedure: 'SMILE 全飛秒近視雷射透鏡取出術 (Small Incision Lenticule Extraction)',
      surgeon: '陳美娟 醫師',
      anesthesia: '局部點眼麻醉 (Topical Proparacaine)',
      laserEnergyNJ: 125,
      capThicknessUm: 120,
      complications: 'None',
      status: 'IN_SURGERY'
    },
    postOp: {
      followUps: [
        { day: 'Day 1 (術後第 1 天預估)', date: '2026-10-25', ucva: '0.9', bcva: '1.0', iop: 13.5, woundSeal: 'Intact 2mm incision', notes: '角膜瓣邊緣平整，透鏡切口密合' }
      ]
    }
  },
  {
    patuuid: 'PAT-2026-003',
    mrn: 'MRN-773821',
    firstName: '志偉',
    lastName: '陳',
    name: '陳志偉 (Chen, Chih-Wei)',
    gender: 'MALE',
    birthday: '1954-11-05',
    age: 72,
    tel: '0928-112-233',
    allergies: 'Aspirin (阿斯匹靈致胃出血)',
    systemicDiseases: ['原發性開角型青光眼 (POAG)', '高血壓 (HTN)'],
    diagnosis: '青光眼併中度核性白內障 (POAG with Nuclear Cataract, OD)',
    status: 'WAITING_ASSESSMENT',
    assignedSurgeon: '林憲銘 主任醫師',
    preOp: {
      examDate: '2026-10-24',
      asaClass: 'ASA II',
      od: {
        eye: 'OD',
        ucva: '0.2',
        bcva: '0.4',
        sphere: '+2.00',
        cylinder: '-1.00',
        axis: '100',
        sphericalEquivalent: 1.50,
        iop: 24.2, // Elevated IOP
        cct: 535,
        k1: 43.20,
        k2: 44.10,
        axialLength: 23.40,
        corneaStatus: 'Clear, Cup-to-Disc ratio 0.7',
        anteriorChamberDepth: 2.85,
        calculatedIOLPowerD: 22.0
      },
      os: {
        eye: 'OS',
        ucva: '0.5',
        bcva: '0.8',
        sphere: '+1.00',
        cylinder: '-0.50',
        axis: '90',
        sphericalEquivalent: 0.75,
        iop: 21.0,
        cct: 540,
        k1: 43.50,
        k2: 43.85,
        axialLength: 23.50,
        corneaStatus: 'C/D ratio 0.6',
        anteriorChamberDepth: 2.90,
        calculatedIOLPowerD: 21.5
      }
    },
    surgery: {
      caseId: 'SURG-2026-103',
      orRoom: 'OR-1 (微創眼科專屬手術室)',
      surgeryDate: '2026-10-26',
      targetEye: 'OD (右眼)',
      procedure: '白內障微創超音波乳化併微導管隅角切開術 (Phaco + MIGS Kahook Dual Blade)',
      surgeon: '林憲銘 主任醫師',
      anesthesia: '局部麻醉併眼球後阻斷 (Retrobulbar Block)',
      status: 'SCHEDULED'
    },
    postOp: { followUps: [] }
  }
];

class ClinicalDatabase {
  constructor() {
    this.patients = new Map();
    INITIAL_PATIENTS.forEach(p => this.patients.set(p.patuuid, p));

    this.orRooms = [
      { id: 'OR-1', name: '第一手術室 (超音波乳化/白內障)', currentCase: '王建明 (已順利完成)', status: 'CLEANING', surgeon: '林憲銘 主任醫師' },
      { id: 'OR-2', name: '第二手術室 (SMILE 全飛秒雷射)', currentCase: '李佩珊 (透鏡分離中)', status: 'IN_SURGERY', surgeon: '陳美娟 醫師' },
      { id: 'OR-3', name: '第三手術室 (玻璃體視網膜微創)', currentCase: '備用待命 (Standby)', status: 'AVAILABLE', surgeon: '全體輪值' }
    ];
  }

  getAllPatients() {
    return Array.from(this.patients.values());
  }

  getPatientById(patuuid) {
    return this.patients.get(patuuid);
  }

  updatePreOp(patuuid, preOpData) {
    const patient = this.getPatientById(patuuid);
    if (!patient) return null;

    patient.preOp = { ...patient.preOp, ...preOpData };
    return patient;
  }

  updateSurgery(patuuid, surgeryData) {
    const patient = this.getPatientById(patuuid);
    if (!patient) return null;

    patient.surgery = { ...patient.surgery, ...surgeryData };
    return patient;
  }

  addFollowUp(patuuid, followUpRecord) {
    const patient = this.getPatientById(patuuid);
    if (!patient) return null;

    patient.postOp = patient.postOp || { followUps: [] };
    patient.postOp.followUps.push(followUpRecord);
    return patient;
  }

  getOrRooms() {
    return this.orRooms;
  }

  getStats() {
    const all = this.getAllPatients();
    return {
      totalPatients: all.length,
      preOpCount: all.filter(p => p.status === 'WAITING_ASSESSMENT').length,
      inSurgeryCount: all.filter(p => p.status === 'IN_PREP').length,
      postOpCount: all.filter(p => p.status === 'POST_OP').length,
      orUtilizationPercent: 75
    };
  }
}

export const clinicalDb = new ClinicalDatabase();
