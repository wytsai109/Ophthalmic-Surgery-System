/**
 * OphthaCare 2.0 - Ophthalmic Surgery & Perioperative Clinical Server
 * 
 * Node.js 22 (ES Modules), Express RESTful APIs & Clinical Informatics
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { clinicalDb } from './services/clinicalDb.js';
import { calculateIOLPower, calculateSphericalEquivalent, correctIOPbyCCT } from './services/ophthalmicEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================================
   RESTful Clinical API Endpoints
   ========================================================================== */

// 1. Health check & Clinical System Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'OphthaCare 2.0 Ophthalmic Perioperative Clinical Server',
    runtime: `Node.js ${process.version}`,
    standards: ['HL7 FHIR R4 Compliant Schemas', 'SRK/T IOL Power Formulation'],
    activePatients: clinicalDb.getAllPatients().length,
    timestamp: new Date().toISOString()
  });
});

// 2. Patient List
app.get('/api/patients', (req, res) => {
  res.json({
    success: true,
    total: clinicalDb.getAllPatients().length,
    patients: clinicalDb.getAllPatients()
  });
});

// 3. Single Patient Full Perioperative Record
app.get('/api/patients/:id', (req, res) => {
  const patient = clinicalDb.getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }
  res.json({ success: true, patient });
});

// 4. Calculate IOL Power (SRK/T Formula)
app.post('/api/calculate-iol', (req, res) => {
  const { axialLength, k1, k2, aConstant = 118.9, targetRefraction = 0.0 } = req.body;

  if (!axialLength || !k1 || !k2) {
    return res.status(400).json({ success: false, message: 'Missing parameters: axialLength, k1, k2 are required' });
  }

  const result = calculateIOLPower(axialLength, k1, k2, aConstant, targetRefraction);
  res.json({ success: true, calculation: result });
});

// 5. Correct IOP by Central Corneal Thickness (CCT)
app.post('/api/correct-iop', (req, res) => {
  const { measuredIOP, cctMicrons } = req.body;
  if (!measuredIOP || !cctMicrons) {
    return res.status(400).json({ success: false, message: 'measuredIOP and cctMicrons are required' });
  }

  const result = correctIOPbyCCT(measuredIOP, cctMicrons);
  res.json({ success: true, result });
});

// 6. Update Pre-Op Assessment
app.post('/api/patients/:id/preop', (req, res) => {
  const patient = clinicalDb.updatePreOp(req.params.id, req.body);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }
  res.json({ success: true, message: 'Pre-operative assessment updated', patient });
});

// 7. Update Surgery Case Log
app.post('/api/patients/:id/surgery', (req, res) => {
  const patient = clinicalDb.updateSurgery(req.params.id, req.body);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }
  res.json({ success: true, message: 'Surgical case log updated', patient });
});

// 8. Add Post-Op Follow-up Visit
app.post('/api/patients/:id/postop/followup', (req, res) => {
  const patient = clinicalDb.addFollowUp(req.params.id, req.body);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }
  res.json({ success: true, message: 'Post-operative visit logged', patient });
});

// 9. Operating Room Live Schedule
app.get('/api/or-rooms', (req, res) => {
  res.json({
    success: true,
    rooms: clinicalDb.getOrRooms()
  });
});

// 10. Clinical Performance KPI Stats
app.get('/api/stats/clinical', (req, res) => {
  res.json({
    success: true,
    stats: clinicalDb.getStats()
  });
});

// Launch Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`👁️  OphthaCare 2.0 Clinical Server is Online!`);
  console.log(`🌐 Clinical Workstation: http://localhost:${PORT}`);
  console.log(`🏥 Perioperative Ophthalmology Management`);
  console.log(`🚀 Node.js Runtime: ${process.version}`);
  console.log(`=======================================================`);
});
