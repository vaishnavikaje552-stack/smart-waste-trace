/**
 * SMART WASTE TRACE - CORE DATA MANAGEMENT & SIMULATION ENGINE
 * Uses localStorage to persist simulated data with a realistic seed dataset.
 */

const STORAGE_KEYS = {
  BATCHES: 'swt_batches',
  CENTERS: 'swt_centers',
  ALERTS: 'swt_alerts',
  TRANSPORT: 'swt_transport',
  PROCESSING: 'swt_processing',
  USER: 'swt_user'
};

// Seed dataset for Initial Setup
const INITIAL_PROCESSING_CENTERS = [
  {
    id: 'PC-001',
    name: 'Pune Eco-Compost Facility',
    type: 'Organic Waste Composting',
    location: 'Hadapsar Green Belt, Pune',
    authorized: true,
    authCode: 'MPCB-COMP-2024-88',
    capacityKg: 5000,
    currentUtilizationKg: 3900,
    batchesReceived: 42,
    contactPerson: 'Sunil Deshmukh (Plant Mgr)',
    phone: '+91 98220 11223'
  },
  {
    id: 'PC-002',
    name: 'Sahyadri Polymer Recycling Hub',
    type: 'Plastic Reclamation & Pelleting',
    location: 'Chakan Industrial Zone Ph-2',
    authorized: true,
    authCode: 'MPCB-PLAS-2023-41',
    capacityKg: 8000,
    currentUtilizationKg: 5200,
    batchesReceived: 38,
    contactPerson: 'Anand Shinde',
    phone: '+91 98221 44556'
  },
  {
    id: 'PC-003',
    name: 'Apex Green E-Waste Recovery',
    type: 'Electronic Waste & Circuit Recovery',
    location: 'Talwade Software Tech Park',
    authorized: true,
    authCode: 'CPCB-EW-2024-19',
    capacityKg: 2500,
    currentUtilizationKg: 2100,
    batchesReceived: 21,
    contactPerson: 'Priya Narvekar',
    phone: '+91 98223 77889'
  },
  {
    id: 'PC-004',
    name: 'Maharashtra Paper Pulping Ltd',
    type: 'Paper & Cardboard Repulping',
    location: 'Shirwal Industrial Corridor',
    authorized: true,
    authCode: 'MPCB-PAP-2022-77',
    capacityKg: 6000,
    currentUtilizationKg: 3120,
    batchesReceived: 29,
    contactPerson: 'Vikram Joshi',
    phone: '+91 98225 99001'
  },
  {
    id: 'PC-005',
    name: 'Deccan Metal Reclamation Hub',
    type: 'Ferrous & Non-Ferrous Smelting',
    location: 'Bhosari MIDC Sector 7',
    authorized: true,
    authCode: 'MPCB-MET-2023-102',
    capacityKg: 10000,
    currentUtilizationKg: 7100,
    batchesReceived: 45,
    contactPerson: 'Rameshwar Patil',
    phone: '+91 98228 33445'
  },
  {
    id: 'PC-006',
    name: 'Pune Urban Waste MRF Center',
    type: 'Material Recovery & Sorting',
    location: 'Kothrud Transfer Station, Pune',
    authorized: true,
    authCode: 'PMC-SWM-2024-009',
    capacityKg: 12000,
    currentUtilizationKg: 10680,
    batchesReceived: 63,
    contactPerson: 'Kishore Bhende',
    phone: '+91 98229 66778'
  }
];

const INITIAL_BATCHES = [
  {
    id: 'WB-0001',
    wasteType: 'Organic',
    collectedQuantityKg: 500,
    receivedQuantityKg: 490,
    processedQuantityKg: 470,
    processingMethod: 'Composting (Windrow aerobic)',
    collectionLocation: 'Kothrud Ward 12, Pune',
    collectionDate: '2026-11-01',
    collectionTime: '08:30 AM',
    vehicleNumber: 'MH12AB1234',
    driverName: 'Santosh Pawar',
    assignedCenter: 'Pune Eco-Compost Facility',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-01 08:30 AM', location: 'Kothrud Ward 12', status: 'Completed', notes: 'Collected from 42 commercial food establishments. Weighed: 500 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-01 09:15 AM', location: 'Kothrud Hub', status: 'Completed', notes: 'GPS route logged via Karve Road.' },
      { stage: 'Waste Received', timestamp: '2026-11-01 10:45 AM', location: 'Pune Eco-Compost Facility', status: 'Completed', notes: 'Gross weighment 490 kg recorded. 2% moisture loss.' },
      { stage: 'Processing Started', timestamp: '2026-11-01 01:00 PM', location: 'Compost Pit #3', status: 'Completed', notes: 'Segregation and shredding initiated.' },
      { stage: 'Processing Completed', timestamp: '2026-11-03 04:30 PM', location: 'Curing Bay 1', status: 'Completed', notes: '470 kg organic compost yielded.' },
      { stage: 'Final Verification', timestamp: '2026-11-04 11:00 AM', location: 'Municipal QA Portal', status: 'Completed', notes: 'Audited and verified digitally.' }
    ]
  },
  {
    id: 'WB-0002',
    wasteType: 'Plastic',
    collectedQuantityKg: 1200,
    receivedQuantityKg: 1180,
    processedQuantityKg: 1150,
    processingMethod: 'Mechanical Recycling (Pelletizing)',
    collectionLocation: 'Hinjewadi IT Park Ph-1',
    collectionDate: '2026-11-02',
    collectionTime: '07:00 AM',
    vehicleNumber: 'MH14XY5678',
    driverName: 'Ganesh More',
    assignedCenter: 'Sahyadri Polymer Recycling Hub',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-02 07:00 AM', location: 'Hinjewadi Tech Campus', status: 'Completed', notes: 'LDPE and HDPE segregation verified. 1200 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-02 08:00 AM', location: 'Hinjewadi Gate 1', status: 'Completed', notes: 'Highway transit via Katraj Bypass.' },
      { stage: 'Waste Received', timestamp: '2026-11-02 10:15 AM', location: 'Sahyadri Polymer Hub', status: 'Completed', notes: 'Weighbridge confirmation 1180 kg.' },
      { stage: 'Processing Started', timestamp: '2026-11-02 11:30 AM', location: 'Washing & Flaking Line', status: 'Completed', notes: 'Optical color sorting done.' },
      { stage: 'Processing Completed', timestamp: '2026-11-03 06:00 PM', location: 'Extruder Plant 2', status: 'Completed', notes: '1150 kg high-grade resin pellets packaged.' },
      { stage: 'Final Verification', timestamp: '2026-11-04 02:15 PM', location: 'Pollution Control Board Dashboard', status: 'Completed', notes: 'EPR certificate issued.' }
    ]
  },
  {
    id: 'WB-0003',
    wasteType: 'E-Waste',
    collectedQuantityKg: 350,
    receivedQuantityKg: 350,
    processedQuantityKg: null,
    processingMethod: 'Circuit Dismantling & Heavy Metal Recovery',
    collectionLocation: 'Baner Tech Hub, Pune',
    collectionDate: '2026-11-04',
    collectionTime: '10:00 AM',
    vehicleNumber: 'MH12GH9012',
    driverName: 'Sachin Kamble',
    assignedCenter: 'Apex Green E-Waste Recovery',
    status: 'In-Transit',
    riskLevel: 'Low',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-04 10:00 AM', location: 'Baner Commercial Complex', status: 'Completed', notes: '350 kg decommissioned office electronics collected.' },
      { stage: 'Transportation Started', timestamp: '2026-11-04 11:00 AM', location: 'Baner Depot', status: 'Completed', notes: 'En route to Talwade Tech Park facility.' },
      { stage: 'Waste Received', timestamp: 'Pending', location: 'Apex Green Facility', status: 'Pending', notes: 'Awaiting weighbridge docking.' },
      { stage: 'Processing Started', timestamp: 'Pending', location: 'Dismantling Line', status: 'Pending', notes: 'Scheduled upon receipt.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Recovery Unit', status: 'Pending', notes: 'Pending completion.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Verification Desk', status: 'Pending', notes: 'Awaiting process telemetry.' }
    ]
  },
  {
    id: 'WB-0004',
    wasteType: 'Paper',
    collectedQuantityKg: 850,
    receivedQuantityKg: 840,
    processedQuantityKg: 810,
    processingMethod: 'Pulping & Cardboard Board Crafting',
    collectionLocation: 'Shivajinagar Market, Pune',
    collectionDate: '2026-11-02',
    collectionTime: '06:30 AM',
    vehicleNumber: 'MH12CD3456',
    driverName: 'Dhananjay Jadhav',
    assignedCenter: 'Maharashtra Paper Pulping Ltd',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-02 06:30 AM', location: 'Shivajinagar Wholesale Market', status: 'Completed', notes: 'Corrugated boxes and newsprint 850 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-02 07:45 AM', location: 'Shivajinagar Transfer Hub', status: 'Completed', notes: 'Transit to Shirwal facility.' },
      { stage: 'Waste Received', timestamp: '2026-11-02 09:50 AM', location: 'Maharashtra Paper Plant', status: 'Completed', notes: 'Gross weight 840 kg verified.' },
      { stage: 'Processing Started', timestamp: '2026-11-02 11:00 AM', location: 'Hydrapulper Vessel 1', status: 'Completed', notes: 'De-inking and fiber separation.' },
      { stage: 'Processing Completed', timestamp: '2026-11-03 01:20 PM', location: 'Drying Unit', status: 'Completed', notes: '810 kg recycled pulp produced.' },
      { stage: 'Final Verification', timestamp: '2026-11-03 04:00 PM', location: 'Municipal QA Portal', status: 'Completed', notes: 'Certificate of Recycling generated.' }
    ]
  },
  {
    id: 'WB-0005',
    wasteType: 'Metal',
    collectedQuantityKg: 620,
    receivedQuantityKg: null,
    processedQuantityKg: null,
    processingMethod: 'Magnetic Sorting & Electric Arc Remelt',
    collectionLocation: 'Pimpri Industrial Zone',
    collectionDate: '2026-11-04',
    collectionTime: '09:15 AM',
    vehicleNumber: 'MH14EF7890',
    driverName: 'Deepak Thorat',
    assignedCenter: 'Deccan Metal Reclamation Hub',
    status: 'In-Transit',
    riskLevel: 'Medium',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-04 09:15 AM', location: 'Pimpri MIDC Plot 44', status: 'Completed', notes: 'Steel scrap and turning waste: 620 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-04 10:00 AM', location: 'Pimpri Gate', status: 'Completed', notes: 'Departure logged.' },
      { stage: 'Waste Received', timestamp: 'FLAGGED DELAY', location: 'In-Transit (NH-48 Halting point)', status: 'Pending', notes: 'AI Detection: Vehicle stationary for 4.2 hours outside designated route corridor.' },
      { stage: 'Processing Started', timestamp: 'Pending', location: 'Smelting Furnace 2', status: 'Pending', notes: 'Awaiting delivery.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Ingot Casting Line', status: 'Pending', notes: 'Awaiting delivery.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Municipal Portal', status: 'Pending', notes: 'Awaiting delivery.' }
    ]
  },
  {
    id: 'WB-0006',
    wasteType: 'Mixed Waste',
    collectedQuantityKg: 1500,
    receivedQuantityKg: 1420,
    processedQuantityKg: 1390,
    processingMethod: 'Refuse Derived Fuel (RDF) & Compost Sorting',
    collectionLocation: 'Hadapsar Ward 4, Pune',
    collectionDate: '2026-11-03',
    collectionTime: '07:30 AM',
    vehicleNumber: 'MH12JK2345',
    driverName: 'Vikram Gaikwad',
    assignedCenter: 'Pune Urban Waste MRF Center',
    status: 'Discrepancy Flagged',
    riskLevel: 'Medium',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-03 07:30 AM', location: 'Hadapsar Ward 4', status: 'Completed', notes: 'Municipal hopper collection: 1500 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-03 08:30 AM', location: 'Hadapsar Point', status: 'Completed', notes: 'Dispatched to MRF.' },
      { stage: 'Waste Received', timestamp: '2026-11-03 09:30 AM', location: 'Pune Urban MRF', status: 'Completed', notes: 'Weighbridge reading: 1420 kg (80 kg / 5.3% discrepancy detected).' },
      { stage: 'Processing Started', timestamp: '2026-11-03 11:00 AM', location: 'Trommel Screen 1', status: 'Completed', notes: 'Segregation into wet and combustible.' },
      { stage: 'Processing Completed', timestamp: '2026-11-04 03:00 PM', location: 'RDF Baling Plant', status: 'Completed', notes: '1390 kg processed into RDF pellets and dry fraction.' },
      { stage: 'Final Verification', timestamp: '2026-11-04 05:00 PM', location: 'Auditor Desk', status: 'Completed', notes: 'Warning issued for weighing calibration.' }
    ]
  },
  {
    id: 'WB-0007',
    wasteType: 'Organic',
    collectedQuantityKg: 750,
    receivedQuantityKg: null,
    processedQuantityKg: null,
    processingMethod: 'Biomethanation (Bio-CNG)',
    collectionLocation: 'Viman Nagar Food Zone',
    collectionDate: '2026-11-05',
    collectionTime: '06:00 AM',
    vehicleNumber: 'MH12LM6789',
    driverName: 'Mahesh Chavan',
    assignedCenter: 'Pune Eco-Compost Facility',
    status: 'In-Transit',
    riskLevel: 'Low',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-05 06:00 AM', location: 'Viman Nagar Food Street', status: 'Completed', notes: 'Restaurant kitchen wet organic waste: 750 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-05 06:45 AM', location: 'Airport Road Depot', status: 'Completed', notes: 'Transit underway.' },
      { stage: 'Waste Received', timestamp: 'Pending', location: 'Pune Eco-Compost Facility', status: 'Pending', notes: 'Estimated arrival 09:30 AM.' },
      { stage: 'Processing Started', timestamp: 'Pending', location: 'Anaerobic Digester #1', status: 'Pending', notes: 'Pending.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Gas Purification Unit', status: 'Pending', notes: 'Pending.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Portal Desk', status: 'Pending', notes: 'Pending.' }
    ]
  },
  {
    id: 'WB-0008',
    wasteType: 'Plastic',
    collectedQuantityKg: 420,
    receivedQuantityKg: 410,
    processedQuantityKg: 395,
    processingMethod: 'Chemical Recycling (Pyrolysis oil conversion)',
    collectionLocation: 'Aundh Residential Sector',
    collectionDate: '2026-11-03',
    collectionTime: '08:00 AM',
    vehicleNumber: 'MH14NP0123',
    driverName: 'Sanjay Salunkhe',
    assignedCenter: 'Sahyadri Polymer Recycling Hub',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-03 08:00 AM', location: 'Aundh Green Collection Hub', status: 'Completed', notes: 'Multi-layer packaging plastics 420 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-03 09:00 AM', location: 'Aundh Point', status: 'Completed', notes: 'Transit logged.' },
      { stage: 'Waste Received', timestamp: '2026-11-03 10:40 AM', location: 'Sahyadri Polymer Hub', status: 'Completed', notes: '410 kg received.' },
      { stage: 'Processing Started', timestamp: '2026-11-03 12:15 PM', location: 'Pyrolysis Reactor #2', status: 'Completed', notes: 'Thermal cracking initiated.' },
      { stage: 'Processing Completed', timestamp: '2026-11-04 02:00 PM', location: 'Condenser Bay', status: 'Completed', notes: '395 kg fuel oil fraction obtained.' },
      { stage: 'Final Verification', timestamp: '2026-11-04 04:30 PM', location: 'EPR Regulatory Desk', status: 'Completed', notes: 'Verification signoff complete.' }
    ]
  },
  {
    id: 'WB-0009',
    wasteType: 'E-Waste',
    collectedQuantityKg: 280,
    receivedQuantityKg: 240,
    processedQuantityKg: null,
    processingMethod: 'Printed Circuit Board Leaching',
    collectionLocation: 'Kharadi IT Corridor, Pune',
    collectionDate: '2026-11-03',
    collectionTime: '02:00 PM',
    vehicleNumber: 'MH12RS4567',
    driverName: 'Rajendra Bhosale',
    assignedCenter: 'Apex Green E-Waste Recovery',
    status: 'Discrepancy Flagged',
    riskLevel: 'High',
    receivingConfirmed: true,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-03 02:00 PM', location: 'Kharadi Tech Park Sector 2', status: 'Completed', notes: 'High value server motherboards and RAM: 280 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-03 03:00 PM', location: 'Kharadi Gateway', status: 'Completed', notes: 'Driver assigned.' },
      { stage: 'Waste Received', timestamp: '2026-11-03 05:40 PM', location: 'Apex Green Recovery', status: 'Completed', notes: 'CRITICAL DISCREPANCY: 240 kg received. 40 kg (14.3%) missing from container.' },
      { stage: 'Processing Started', timestamp: 'HALTED', location: 'Inspection Quarantine', status: 'Pending', notes: 'Quarantined pending municipal inquiry.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Recovery Unit', status: 'Pending', notes: 'On hold.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Audit Bureau', status: 'Pending', notes: 'Investigative alert active.' }
    ]
  },
  {
    id: 'WB-0010',
    wasteType: 'Metal',
    collectedQuantityKg: 900,
    receivedQuantityKg: 890,
    processedQuantityKg: 870,
    processingMethod: 'Shredding & Magnetic Separation',
    collectionLocation: 'Bhosari MIDC Industrial Zone',
    collectionDate: '2026-11-01',
    collectionTime: '11:00 AM',
    vehicleNumber: 'MH14TU8901',
    driverName: 'Ashok Mohite',
    assignedCenter: 'Deccan Metal Reclamation Hub',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-01 11:00 AM', location: 'Bhosari Auto Cluster', status: 'Completed', notes: 'Cast iron turning chips: 900 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-01 11:45 AM', location: 'Bhosari Hub', status: 'Completed', notes: 'Short transit within industrial area.' },
      { stage: 'Waste Received', timestamp: '2026-11-01 12:30 PM', location: 'Deccan Reclamation Hub', status: 'Completed', notes: '890 kg logged.' },
      { stage: 'Processing Started', timestamp: '2026-11-01 02:00 PM', location: 'Induction Furnace #1', status: 'Completed', notes: 'Direct remelting and slag filtration.' },
      { stage: 'Processing Completed', timestamp: '2026-11-02 04:00 PM', location: 'Foundry Bed', status: 'Completed', notes: '870 kg structural grade ingots produced.' },
      { stage: 'Final Verification', timestamp: '2026-11-03 10:00 AM', location: 'MPCB Green Portal', status: 'Completed', notes: 'Traceability verified.' }
    ]
  },
  {
    id: 'WB-0011',
    wasteType: 'Plastic',
    collectedQuantityKg: 680,
    receivedQuantityKg: null,
    processedQuantityKg: null,
    processingMethod: 'Mechanical Washing & Flaking',
    collectionLocation: 'Swargate Bus Terminal',
    collectionDate: '2026-11-05',
    collectionTime: '08:15 AM',
    vehicleNumber: 'MH12VW2345',
    driverName: 'Nitin Tambe',
    assignedCenter: 'Sahyadri Polymer Recycling Hub',
    status: 'In-Transit',
    riskLevel: 'Low',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-05 08:15 AM', location: 'Swargate Terminal Depot', status: 'Completed', notes: 'PET drinking bottles from passenger terminals: 680 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-05 09:00 AM', location: 'Swargate Hub', status: 'Completed', notes: 'Transit to Chakan Hub.' },
      { stage: 'Waste Received', timestamp: 'Pending', location: 'Sahyadri Polymer Hub', status: 'Pending', notes: 'Expected arrival 11:45 AM.' },
      { stage: 'Processing Started', timestamp: 'Pending', location: 'Line 3', status: 'Pending', notes: 'Pending.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Baling Area', status: 'Pending', notes: 'Pending.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Portal Desk', status: 'Pending', notes: 'Pending.' }
    ]
  },
  {
    id: 'WB-0012',
    wasteType: 'Organic',
    collectedQuantityKg: 1100,
    receivedQuantityKg: 1080,
    processedQuantityKg: 1040,
    processingMethod: 'Biocomposting & Vermiculture',
    collectionLocation: 'Market Yard Gultekdi, Pune',
    collectionDate: '2026-11-02',
    collectionTime: '05:00 AM',
    vehicleNumber: 'MH12ZA6789',
    driverName: 'Arun Jagtap',
    assignedCenter: 'Pune Eco-Compost Facility',
    status: 'Completed',
    riskLevel: 'Low',
    receivingConfirmed: true,
    processingConfirmed: true,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-02 05:00 AM', location: 'Gultekdi Vegetable Mandi', status: 'Completed', notes: 'Wholesale vegetable discards: 1100 kg.' },
      { stage: 'Transportation Started', timestamp: '2026-11-02 06:15 AM', location: 'Market Yard South Gate', status: 'Completed', notes: 'Direct transport to Hadapsar.' },
      { stage: 'Waste Received', timestamp: '2026-11-02 07:30 AM', location: 'Pune Eco-Compost Hub', status: 'Completed', notes: '1080 kg accepted.' },
      { stage: 'Processing Started', timestamp: '2026-11-02 09:00 AM', location: 'Vermiculture Pit #5', status: 'Completed', notes: 'Earthworm inoculation with Eisenia fetida.' },
      { stage: 'Processing Completed', timestamp: '2026-11-04 11:30 AM', location: 'Screening Unit', status: 'Completed', notes: '1040 kg premium organic compost packaged.' },
      { stage: 'Final Verification', timestamp: '2026-11-04 03:00 PM', location: 'Municipal QA Portal', status: 'Completed', notes: 'Organic certification validated.' }
    ]
  },
  // Suspicious Batches from User Requirements
  {
    id: 'WB-0015',
    wasteType: 'Organic',
    collectedQuantityKg: 600,
    receivedQuantityKg: 510,
    processedQuantityKg: null,
    processingMethod: 'Composting',
    collectionLocation: 'Camp Area Cantonment, Pune',
    collectionDate: '2026-11-04',
    collectionTime: '07:30 AM',
    vehicleNumber: 'MH12BC7890',
    driverName: 'Ramesh Kadam',
    assignedCenter: 'Pune Eco-Compost Facility',
    status: 'Discrepancy Flagged',
    riskLevel: 'High',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-04 07:30 AM', location: 'Camp Military & Food Market', status: 'Completed', notes: 'Batch collected 600 kg. Driver dispatched.' },
      { stage: 'Transportation Started', timestamp: '2026-11-04 08:30 AM', location: 'East Street Point', status: 'Completed', notes: 'Vehicle departed.' },
      { stage: 'Waste Received', timestamp: '2026-11-04 11:15 AM', location: 'Pune Eco-Compost Hub', status: 'Completed', notes: 'CRITICAL ALERT: 510 kg recorded. 90 kg missing! Receiving supervisor refused electronic signoff.' },
      { stage: 'Processing Started', timestamp: 'BLOCKED', location: 'Facility Bay', status: 'Pending', notes: 'Processing blocked pending dispute resolution.' },
      { stage: 'Processing Completed', timestamp: 'Pending', location: 'Compost Bed', status: 'Pending', notes: 'No processing records found.' },
      { stage: 'Final Verification', timestamp: 'Pending', location: 'Audit Office', status: 'Pending', notes: 'Verification revoked due to severe audit flags.' }
    ]
  },
  {
    id: 'WB-0016',
    wasteType: 'Mixed Waste',
    collectedQuantityKg: 800,
    receivedQuantityKg: null,
    processedQuantityKg: null,
    processingMethod: 'MRF Segregation',
    collectionLocation: 'Katraj Ghat Sector',
    collectionDate: '2026-11-04',
    collectionTime: '01:00 PM',
    vehicleNumber: 'MH12DE9012',
    driverName: 'Sanjay Ubale',
    assignedCenter: 'Pune Urban Waste MRF Center',
    status: 'Discrepancy Flagged',
    riskLevel: 'High',
    receivingConfirmed: false,
    processingConfirmed: false,
    chainOfCustody: [
      { stage: 'Waste Collection', timestamp: '2026-11-04 01:00 PM', location: 'Katraj Ward Depot', status: 'Completed', notes: 'Collected 800 kg mixed commercial scrap.' },
      { stage: 'Transportation Started', timestamp: '2026-11-04 01:45 PM', location: 'Katraj Outpost', status: 'Completed', notes: 'Vehicle departed towards Hadapsar MRF.' },
      { stage: 'Waste Received', timestamp: 'ANOMALY DETECTED', location: 'Unauthorized Rural Dump Site (Saswad Road)', status: 'Pending', notes: 'GPS geofencing trip triggered: vehicle diverted 14 km away from authorized MRF.' },
      { stage: 'Processing Started', timestamp: 'MISSING', location: 'MRF Center', status: 'Pending', notes: 'Zero arrival records.' },
      { stage: 'Processing Completed', timestamp: 'MISSING', location: 'MRF Center', status: 'Pending', notes: 'No telemetry.' },
      { stage: 'Final Verification', timestamp: 'FAILED', location: 'Central Enforcement Command', status: 'Pending', notes: 'Summons issued to fleet contractor.' }
    ]
  }
];

const INITIAL_ALERTS = [
  {
    id: 'ALT-101',
    batchId: 'WB-0015',
    riskLevel: 'High',
    issueType: 'Quantity Discrepancy & Missing Confirmation',
    aiExplanation: 'Simulated AI pattern analysis detected a 90 kg (15.0%) deficit between collection weighment (600 kg) and gate arrival (510 kg). Electronic receiving confirmation was withheld by the facility supervisor.',
    recommendedAction: 'Place immediate audit hold on vehicle MH12BC7890. Request driver weighbridge receipts and conduct physical inspection of container seal.',
    date: '2026-11-04 11:20 AM',
    isReviewed: false
  },
  {
    id: 'ALT-102',
    batchId: 'WB-0016',
    riskLevel: 'High',
    issueType: 'Destination Mismatch & Route Deviation',
    aiExplanation: 'Simulated AI geofencing algorithm detected the transport vehicle deviated 14.2 km outside the authorized transit corridor. The batch was dumped or unloaded at an uncertified Saswad Road location instead of Pune Urban MRF.',
    recommendedAction: 'Dispatch municipal enforcement unit to Saswad Road coordinates (18.3491° N, 74.0312° E). Freeze contractor payment for trip MH12DE9012.',
    date: '2026-11-04 02:30 PM',
    isReviewed: false
  },
  {
    id: 'ALT-103',
    batchId: 'WB-0009',
    riskLevel: 'High',
    issueType: 'High-Value Material Divergence',
    aiExplanation: 'Simulated AI material variance check flagged a 40 kg loss in E-Waste server electronics category. E-waste loss above 2% exceeds standard loss tolerances and indicates potential illicit component harvesting.',
    recommendedAction: 'Perform biometric custody review of Kharadi loading operators and quarantine batch WB-0009 at Apex Green until forensic weight audit completes.',
    date: '2026-11-03 05:45 PM',
    isReviewed: false
  },
  {
    id: 'ALT-104',
    batchId: 'WB-0005',
    riskLevel: 'Medium',
    issueType: 'Unusual Transportation Delays',
    aiExplanation: 'Simulated AI journey duration model estimated 45 mins transit between Pimpri and Bhosari. Vehicle has been stationary on roadside for 252 minutes without sensor tamper alerts.',
    recommendedAction: 'Automated SMS prompt sent to driver Deepak Thorat. Municipal dispatch called to confirm breakdown or mechanical failure.',
    date: '2026-11-04 01:10 PM',
    isReviewed: true
  },
  {
    id: 'ALT-105',
    batchId: 'WB-0006',
    riskLevel: 'Medium',
    issueType: 'Quantity Discrepancy',
    aiExplanation: 'Simulated AI discrepancy model found an 80 kg (5.33%) divergence between collection hopper (1500 kg) and receiving hopper (1420 kg) at Pune Urban MRF.',
    recommendedAction: 'Issue maintenance ticket to recalibrate weighbridge sensor #4 at Hadapsar Transfer hub. No malicious diversion suspected.',
    date: '2026-11-03 10:00 AM',
    isReviewed: true
  },
  {
    id: 'ALT-106',
    batchId: 'WB-0003',
    riskLevel: 'Low',
    issueType: 'Missing Receiving Confirmation',
    aiExplanation: 'Simulated AI audit flagged that electronic handshake at Apex Green has been pending for over 180 minutes since transport initiation.',
    recommendedAction: 'Notify plant receiving desk to scan batch WB-0003 QR code upon unloading.',
    date: '2026-11-04 02:00 PM',
    isReviewed: false
  }
];

const INITIAL_TRANSPORT_LOGS = [
  {
    id: 'TR-501',
    batchId: 'WB-0001',
    vehicleNumber: 'MH12AB1234',
    driverName: 'Santosh Pawar',
    currentLocation: 'Hadapsar Green Belt',
    destination: 'Pune Eco-Compost Facility',
    departureTime: '2026-11-01 09:15 AM',
    arrivalTime: '2026-11-01 10:45 AM',
    transferStatus: 'Delivered',
    gpsCoordinates: '18.5089° N, 73.9260° E',
    notes: 'Safe transit completed, seal verified intact.'
  },
  {
    id: 'TR-502',
    batchId: 'WB-0002',
    vehicleNumber: 'MH14XY5678',
    driverName: 'Ganesh More',
    currentLocation: 'Chakan MIDC Ph-2',
    destination: 'Sahyadri Polymer Hub',
    departureTime: '2026-11-02 08:00 AM',
    arrivalTime: '2026-11-02 10:15 AM',
    transferStatus: 'Delivered',
    gpsCoordinates: '18.7606° N, 73.8636° E',
    notes: 'Highway route followed without deviations.'
  },
  {
    id: 'TR-503',
    batchId: 'WB-0003',
    vehicleNumber: 'MH12GH9012',
    driverName: 'Sachin Kamble',
    currentLocation: 'Aundh-Ravet Road',
    destination: 'Apex Green E-Waste Recovery',
    departureTime: '2026-11-04 11:00 AM',
    arrivalTime: 'En Route (Est. 12:45 PM)',
    transferStatus: 'In-Transit',
    gpsCoordinates: '18.6186° N, 73.7850° E',
    notes: 'Normal traffic conditions, moving at 42 km/h.'
  },
  {
    id: 'TR-504',
    batchId: 'WB-0005',
    vehicleNumber: 'MH14EF7890',
    driverName: 'Deepak Thorat',
    currentLocation: 'NH-48 Service Road, Kasarwadi',
    destination: 'Deccan Metal Reclamation Hub',
    departureTime: '2026-11-04 10:00 AM',
    arrivalTime: 'Delayed',
    transferStatus: 'Delayed',
    gpsCoordinates: '18.6010° N, 73.8234° E',
    notes: 'Vehicle stationary since 10:40 AM. Driver reported punctured tire.'
  },
  {
    id: 'TR-505',
    batchId: 'WB-0007',
    vehicleNumber: 'MH12LM6789',
    driverName: 'Mahesh Chavan',
    currentLocation: 'Mundhwa Bridge',
    destination: 'Pune Eco-Compost Facility',
    departureTime: '2026-11-05 06:45 AM',
    arrivalTime: 'En Route (Est. 09:30 AM)',
    transferStatus: 'In-Transit',
    gpsCoordinates: '18.5362° N, 73.9189° E',
    notes: 'Moving smoothly along designated morning green-corridor.'
  },
  {
    id: 'TR-506',
    batchId: 'WB-0015',
    vehicleNumber: 'MH12BC7890',
    driverName: 'Ramesh Kadam',
    currentLocation: 'Hadapsar Facility Gate',
    destination: 'Pune Eco-Compost Facility',
    departureTime: '2026-11-04 08:30 AM',
    arrivalTime: '2026-11-04 11:15 AM',
    transferStatus: 'Disputed Delivery',
    gpsCoordinates: '18.5089° N, 73.9260° E',
    notes: 'Discrepancy of 90 kg detected upon arrival. Weighment disputed.'
  },
  {
    id: 'TR-507',
    batchId: 'WB-0016',
    vehicleNumber: 'MH12DE9012',
    driverName: 'Sanjay Ubale',
    currentLocation: 'Saswad Road (Unauthorized Zone)',
    destination: 'Pune Urban Waste MRF Center (Expected)',
    departureTime: '2026-11-04 01:45 PM',
    arrivalTime: 'Diverted',
    transferStatus: 'Route Deviation',
    gpsCoordinates: '18.3491° N, 74.0312° E',
    notes: 'ALERT: Deviated from designated MRF destination by 14.2 km.'
  }
];

const INITIAL_PROCESSING_RECORDS = [
  {
    id: 'PR-801',
    batchId: 'WB-0001',
    centerName: 'Pune Eco-Compost Facility',
    receivedQuantityKg: 490,
    processedQuantityKg: 470,
    processingMethod: 'Composting (Windrow aerobic)',
    processingDate: '2026-11-03',
    processingStatus: 'Completed',
    operatorConfirmation: 'Sunil Deshmukh (Plant Mgr)',
    discrepancyKg: 10,
    discrepancyPercent: 2.0,
    notes: 'Standard moisture reduction observed. High quality C:N ratio verified.'
  },
  {
    id: 'PR-802',
    batchId: 'WB-0002',
    centerName: 'Sahyadri Polymer Recycling Hub',
    receivedQuantityKg: 1180,
    processedQuantityKg: 1150,
    processingMethod: 'Mechanical Recycling (Pelletizing)',
    processingDate: '2026-11-03',
    processingStatus: 'Completed',
    operatorConfirmation: 'Anand Shinde',
    discrepancyKg: 20,
    discrepancyPercent: 1.67,
    notes: 'Optical color sorting resulted in minimal reject rate. Quality Grade A.'
  },
  {
    id: 'PR-803',
    batchId: 'WB-0004',
    centerName: 'Maharashtra Paper Pulping Ltd',
    receivedQuantityKg: 840,
    processedQuantityKg: 810,
    processingMethod: 'Pulping & Cardboard Board Crafting',
    processingDate: '2026-11-03',
    processingStatus: 'Completed',
    operatorConfirmation: 'Vikram Joshi',
    discrepancyKg: 10,
    discrepancyPercent: 1.18,
    notes: '810 kg dry recycled cardboard sheet yield obtained.'
  },
  {
    id: 'PR-804',
    batchId: 'WB-0006',
    centerName: 'Pune Urban Waste MRF Center',
    receivedQuantityKg: 1420,
    processedQuantityKg: 1390,
    processingMethod: 'Refuse Derived Fuel (RDF) & Compost Sorting',
    processingDate: '2026-11-04',
    processingStatus: 'Completed',
    operatorConfirmation: 'Kishore Bhende',
    discrepancyKg: 80,
    discrepancyPercent: 5.33,
    notes: 'Significant discrepancy between field hopper and plant weighbridge. Weighbridge recalibrated.'
  },
  {
    id: 'PR-805',
    batchId: 'WB-0008',
    centerName: 'Sahyadri Polymer Recycling Hub',
    receivedQuantityKg: 410,
    processedQuantityKg: 395,
    processingMethod: 'Chemical Recycling (Pyrolysis oil conversion)',
    processingDate: '2026-11-04',
    processingStatus: 'Completed',
    operatorConfirmation: 'Anand Shinde',
    discrepancyKg: 10,
    discrepancyPercent: 2.38,
    notes: 'Heavy multi-layer plastic bags turned into combustible oil fractions.'
  },
  {
    id: 'PR-806',
    batchId: 'WB-0010',
    centerName: 'Deccan Metal Reclamation Hub',
    receivedQuantityKg: 890,
    processedQuantityKg: 870,
    processingMethod: 'Shredding & Magnetic Separation',
    processingDate: '2026-11-02',
    processingStatus: 'Completed',
    operatorConfirmation: 'Rameshwar Patil',
    discrepancyKg: 10,
    discrepancyPercent: 1.11,
    notes: 'Clean foundry scrap remelted into standardized ingots.'
  },
  {
    id: 'PR-807',
    batchId: 'WB-0012',
    centerName: 'Pune Eco-Compost Facility',
    receivedQuantityKg: 1080,
    processedQuantityKg: 1040,
    processingMethod: 'Biocomposting & Vermiculture',
    processingDate: '2026-11-04',
    processingStatus: 'Completed',
    operatorConfirmation: 'Sunil Deshmukh',
    discrepancyKg: 20,
    discrepancyPercent: 1.82,
    notes: 'Wholesale mandi green discards processed with zero synthetic impurities.'
  }
];

// Initialize Storage if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CENTERS)) {
    localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(INITIAL_PROCESSING_CENTERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSPORT)) {
    localStorage.setItem(STORAGE_KEYS.TRANSPORT, JSON.stringify(INITIAL_TRANSPORT_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROCESSING)) {
    localStorage.setItem(STORAGE_KEYS.PROCESSING, JSON.stringify(INITIAL_PROCESSING_RECORDS));
  }
}

// Ensure storage is initialized immediately
initializeStorage();

// Storage Access Helpers
const DataStore = {
  // Batches
  getBatches() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return data ? JSON.parse(data) : INITIAL_BATCHES;
    } catch (e) {
      return INITIAL_BATCHES;
    }
  },

  getBatchById(id) {
    const batches = this.getBatches();
    return batches.find(b => b.id.toUpperCase() === id.toUpperCase()) || null;
  },

  saveBatch(batchData) {
    const batches = this.getBatches();
    const existingIndex = batches.findIndex(b => b.id === batchData.id);
    if (existingIndex >= 0) {
      batches[existingIndex] = { ...batches[existingIndex], ...batchData };
    } else {
      batches.unshift(batchData);
    }
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return batchData;
  },

  deleteBatch(id) {
    let batches = this.getBatches();
    batches = batches.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    return true;
  },

  generateNextBatchId() {
    const batches = this.getBatches();
    let maxNum = 16;
    batches.forEach(b => {
      const match = b.id.match(/WB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `WB-${String(nextNum).padStart(4, '0')}`;
  },

  // Processing Centers
  getCenters() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CENTERS);
      return data ? JSON.parse(data) : INITIAL_PROCESSING_CENTERS;
    } catch (e) {
      return INITIAL_PROCESSING_CENTERS;
    }
  },

  saveCenter(centerData) {
    const centers = this.getCenters();
    centers.unshift(centerData);
    localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(centers));
    return centerData;
  },

  // AI Risk Alerts
  getAlerts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : INITIAL_ALERTS;
    } catch (e) {
      return INITIAL_ALERTS;
    }
  },

  updateAlertStatus(alertId, isReviewed) {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isReviewed = isReviewed;
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      return alert;
    }
    return null;
  },

  // Transportation Records
  getTransportLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSPORT);
      return data ? JSON.parse(data) : INITIAL_TRANSPORT_LOGS;
    } catch (e) {
      return INITIAL_TRANSPORT_LOGS;
    }
  },

  saveTransportLog(logData) {
    const logs = this.getTransportLogs();
    logs.unshift(logData);
    localStorage.setItem(STORAGE_KEYS.TRANSPORT, JSON.stringify(logs));
    return logData;
  },

  // Processing Records
  getProcessingRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROCESSING);
      return data ? JSON.parse(data) : INITIAL_PROCESSING_RECORDS;
    } catch (e) {
      return INITIAL_PROCESSING_RECORDS;
    }
  },

  saveProcessingRecord(recordData) {
    const records = this.getProcessingRecords();
    records.unshift(recordData);
    localStorage.setItem(STORAGE_KEYS.PROCESSING, JSON.stringify(records));
    return recordData;
  },

  // Waste Journey Integrity Score Calculator
  // Simulated frontend algorithm based on 4 factors (out of 100):
  // 1. Quantity Consistency (30 pts max)
  // 2. Destination Verification (25 pts max)
  // 3. Journey Completion (25 pts max)
  // 4. Processing Verification (20 pts max)
  calculateIntegrityScore(batch) {
    if (!batch) return null;

    let qtyScore = 30;
    let destScore = 25;
    let journeyScore = 25;
    let procScore = 20;
    const explanations = [];

    // Factor 1: Quantity Consistency (30)
    if (batch.receivedQuantityKg !== null && batch.receivedQuantityKg !== undefined) {
      const diff = Math.abs(batch.collectedQuantityKg - batch.receivedQuantityKg);
      const diffPercent = (diff / batch.collectedQuantityKg) * 100;
      if (diffPercent <= 2) {
        qtyScore = 30;
        explanations.push(`Quantity Consistency: Excellent (${diffPercent.toFixed(1)}% variance within normal tolerance).`);
      } else if (diffPercent <= 5) {
        qtyScore = 22;
        explanations.push(`Quantity Consistency: Moderate (${diffPercent.toFixed(1)}% variance, minor shrinkage).`);
      } else if (diffPercent <= 10) {
        qtyScore = 12;
        explanations.push(`Quantity Consistency: Warning (${diffPercent.toFixed(1)}% discrepancy detected).`);
      } else {
        qtyScore = 4;
        explanations.push(`Quantity Consistency: Critical (${diffPercent.toFixed(1)}% discrepancy exceeds safe threshold).`);
      }
    } else {
      qtyScore = 20; // In-transit default
      explanations.push('Quantity Consistency: Pending receiving gate weighment.');
    }

    // Factor 2: Destination Verification (25)
    if (batch.riskLevel === 'High' && batch.status === 'Discrepancy Flagged' && batch.id === 'WB-0016') {
      destScore = 0;
      explanations.push('Destination Verification: FAILED (GPS breadcrumbs show diversion to unauthorized dumping zone).');
    } else if (batch.status === 'Completed' || batch.receivingConfirmed) {
      destScore = 25;
      explanations.push(`Destination Verification: Verified at ${batch.assignedCenter}.`);
    } else {
      destScore = 20;
      explanations.push(`Destination Verification: Route to ${batch.assignedCenter} on active geofence.`);
    }

    // Factor 3: Journey Completion (25)
    if (batch.status === 'Completed') {
      journeyScore = 25;
      explanations.push('Journey Completion: All 6 custodial milestones completed.');
    } else if (batch.status === 'In-Transit') {
      journeyScore = 15;
      explanations.push('Journey Completion: Transit leg active, milestones 1-2 recorded.');
    } else if (batch.status === 'Discrepancy Flagged') {
      journeyScore = 8;
      explanations.push('Journey Completion: Process halted due to audit flags.');
    } else {
      journeyScore = 10;
      explanations.push('Journey Completion: Early stage.');
    }

    // Factor 4: Processing Verification (20)
    if (batch.processingConfirmed && batch.processedQuantityKg) {
      procScore = 20;
      explanations.push(`Processing Verification: Facility confirmed (${batch.processedQuantityKg} kg processed via ${batch.processingMethod || 'Standard Protocol'}).`);
    } else if (batch.receivingConfirmed) {
      procScore = 10;
      explanations.push('Processing Verification: Waste received, awaiting final recycling certificate.');
    } else {
      procScore = 0;
      explanations.push('Processing Verification: No facility processing signoff yet.');
    }

    const totalScore = qtyScore + destScore + journeyScore + procScore;
    let category = 'Exceptional';
    let colorClass = 'badge-completed';

    if (totalScore >= 85) {
      category = 'Exceptional Trust';
      colorClass = 'badge-completed';
    } else if (totalScore >= 70) {
      category = 'Trustworthy';
      colorClass = 'badge-low';
    } else if (totalScore >= 50) {
      category = 'Needs Review';
      colorClass = 'badge-medium';
    } else {
      category = 'High Risk / Compromised';
      colorClass = 'badge-high';
    }

    return {
      totalScore,
      category,
      colorClass,
      breakdown: {
        quantityConsistency: { score: qtyScore, max: 30 },
        destinationVerification: { score: destScore, max: 25 },
        journeyCompletion: { score: journeyScore, max: 25 },
        processingVerification: { score: procScore, max: 20 }
      },
      explanations
    };
  },

  // Aggregated Municipal Statistics
  getStatsSummary() {
    const batches = this.getBatches();
    const alerts = this.getAlerts();

    const totalBatches = batches.length;
    const completedBatches = batches.filter(b => b.status === 'Completed').length;
    const inTransitBatches = batches.filter(b => b.status === 'In-Transit').length;
    const highRiskBatches = batches.filter(b => b.riskLevel === 'High').length;
    const unverifiedBatches = batches.filter(b => !b.receivingConfirmed || !b.processingConfirmed).length;
    const totalWasteCollectedKg = batches.reduce((sum, b) => sum + (Number(b.collectedQuantityKg) || 0), 0);
    const totalWasteProcessedKg = batches.reduce((sum, b) => sum + (Number(b.processedQuantityKg) || 0), 0);

    const unreviewedAlerts = alerts.filter(a => !a.isReviewed).length;

    return {
      totalBatches,
      completedBatches,
      inTransitBatches,
      highRiskBatches,
      unverifiedBatches,
      totalWasteCollectedKg,
      totalWasteProcessedKg,
      unreviewedAlerts
    };
  },

  // Reset to default demo data
  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    localStorage.setItem(STORAGE_KEYS.CENTERS, JSON.stringify(INITIAL_PROCESSING_CENTERS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.TRANSPORT, JSON.stringify(INITIAL_TRANSPORT_LOGS));
    localStorage.setItem(STORAGE_KEYS.PROCESSING, JSON.stringify(INITIAL_PROCESSING_RECORDS));
    return true;
  }
};

// Global formatters
function formatKg(num) {
  if (num === null || num === undefined) return '—';
  return Number(num).toLocaleString('en-IN') + ' kg';
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }
  return dateStr;
}
