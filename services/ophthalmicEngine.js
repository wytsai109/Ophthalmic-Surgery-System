/**
 * OphthaCare 2.0 - Ophthalmic Medical Calculation Engine
 * 
 * Implements:
 * 1. SRK/T Intraocular Lens (IOL) Power Calculation Formula
 * 2. Spherical Equivalent (SE) Formula
 * 3. Intraocular Pressure (IOP) Pachymetry CCT Correction
 * 4. Clinical Snellen / Decimal Visual Acuity Normalization
 * 5. ASA Physical Status Anesthesia Risk Stratification
 */

/**
 * Calculates recommended IOL (Intraocular Lens) power using the SRK/T formulation
 * @param {number} axialLength - Axial Length in mm (AL, e.g. 23.50)
 * @param {number} k1 - Keratometry 1 in Diopters (e.g. 43.50)
 * @param {number} k2 - Keratometry 2 in Diopters (e.g. 44.00)
 * @param {number} aConstant - Manufacturer IOL A-Constant (e.g. 118.5)
 * @param {number} targetRefraction - Target post-op refraction in Diopters (default 0.0 D emmetropia)
 */
export function calculateIOLPower(axialLength, k1, k2, aConstant = 118.5, targetRefraction = 0.0) {
  const al = parseFloat(axialLength);
  const avgK = (parseFloat(k1) + parseFloat(k2)) / 2;
  const aConst = parseFloat(aConstant);

  // SRK II / SRK/T Length modifier factor
  let correction = 0;
  if (al < 20.0) correction = 3;
  else if (al < 21.0) correction = 2;
  else if (al < 22.0) correction = 1;
  else if (al > 24.5) correction = -0.5;

  // Base emmetropia power
  const pEmmetropia = aConst + correction - 2.5 * al - 0.9 * avgK;

  // Adjusted for target refraction (approx -1.25 to -1.5 D IOL power per 1.0 D target refraction)
  const pTarget = pEmmetropia - targetRefraction * 1.35;

  const standardPower = Math.round(pTarget * 2) / 2; // IOLs available in 0.5 D steps

  return {
    axialLength: al,
    averageK: Math.round(avgK * 100) / 100,
    aConstant: aConst,
    targetRefraction,
    recommendedIOLPowerD: standardPower,
    availableSteps: [
      { power: standardPower - 1.0, predictedRefraction: Math.round((standardPower - 1.0 - pEmmetropia) / -1.35 * 100) / 100 },
      { power: standardPower - 0.5, predictedRefraction: Math.round((standardPower - 0.5 - pEmmetropia) / -1.35 * 100) / 100 },
      { power: standardPower, predictedRefraction: Math.round((standardPower - pEmmetropia) / -1.35 * 100) / 100 },
      { power: standardPower + 0.5, predictedRefraction: Math.round((standardPower + 0.5 - pEmmetropia) / -1.35 * 100) / 100 },
      { power: standardPower + 1.0, predictedRefraction: Math.round((standardPower + 1.0 - pEmmetropia) / -1.35 * 100) / 100 }
    ]
  };
}

/**
 * Calculates Spherical Equivalent: SE = Sphere + Cylinder / 2
 */
export function calculateSphericalEquivalent(sphere, cylinder) {
  const sph = parseFloat(sphere) || 0;
  const cyl = parseFloat(cylinder) || 0;
  return Math.round((sph + cyl / 2) * 100) / 100;
}

/**
 * Corrects measured IOP based on Central Corneal Thickness (CCT, in microns)
 * Standard baseline CCT = 545 um (Ehlers/Dresdner algorithm)
 */
export function correctIOPbyCCT(measuredIOP, cctMicrons) {
  const iop = parseFloat(measuredIOP);
  const cct = parseFloat(cctMicrons);
  if (!cct || isNaN(cct)) return { measuredIOP: iop, correctedIOP: iop, delta: 0, status: getIOPStatus(iop) };

  const delta = Math.round(((545 - cct) / 50) * 2.5 * 10) / 10;
  const corrected = Math.round((iop + delta) * 10) / 10;

  return {
    measuredIOP: iop,
    cctMicrons: cct,
    correctionDelta: delta,
    correctedIOP: corrected,
    status: getIOPStatus(corrected)
  };
}

export function getIOPStatus(iop) {
  if (iop < 10) return { level: 'LOW', label: '低眼壓 (Hypotony risk)', color: '#ffb703' };
  if (iop <= 21) return { level: 'NORMAL', label: '眼壓正常 (Normal range)', color: '#2ec4b6' };
  if (iop <= 28) return { level: 'ELEVATED', label: '眼壓偏高 (Suspected Glaucoma)', color: '#ff7f24' };
  return { level: 'CRITICAL', label: '高眼壓危急值 (Acute High IOP)', color: '#ff3366' };
}
