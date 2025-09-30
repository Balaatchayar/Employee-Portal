require("dotenv").config();
const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ------------------ LOGIN ROUTE ------------------
app.post("/api/employee/login", async (req, res) => {
  const { employeeId, password } = req.body;
  const soapBody = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                 xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
    <soap:Header/>
    <soap:Body>
      <n0:ZgrhEmplogFm xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
        <EmployeeId>${employeeId}</EmployeeId>
        <Password>${password}</Password>
      </n0:ZgrhEmplogFm>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const { data } = await axios.post(process.env.SAP_EMP_LOGIN_URL, soapBody, {
      headers: {
        "Content-Type": "application/soap+xml",
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
    });

    xml2js.parseString(data, { explicitArray: false }, (err, result) => {
      if (err) return res.status(500).json({ error: "Parse error" });

      const verification =
        result["env:Envelope"]["env:Body"]["n0:ZgrhEmplogFmResponse"]["Verification"];
      res.json({ status: "X", message: verification });
    });
  } catch (error) {
    res.status(500).json({ error: "Login request failed" });
  }
});

// ------------------ PROFILE ROUTE ------------------
app.post("/api/employee/profile", async (req, res) => {
  const { employeeId } = req.body;
  const soapBody = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                 xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
    <soap:Header/>
    <soap:Body>
      <n0:ZgrhEmpProfFm xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
        <IvPernr>${employeeId}</IvPernr>
      </n0:ZgrhEmpProfFm>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const { data } = await axios.post(process.env.SAP_EMP_PROFILE_URL, soapBody, {
      headers: {
        "Content-Type": "application/soap+xml",
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
    });

    xml2js.parseString(data, { explicitArray: false }, (err, result) => {
      if (err) return res.status(500).json({ error: "Parse error" });

      const profile = result["env:Envelope"]["env:Body"]["n0:ZgrhEmpProfFmResponse"];
      res.json({
        status: "X",
        message: "Profile fetched successfully",
        profile: {
          fullName: profile.EvFullname,
          gender: profile.EvGender,
          dob: profile.EvDob,
          email: profile.EvEmail,
          phone: "9876543210",
          companyCode: profile.EvCompCode,
          department: profile.EvDepartment,
          position: profile.EvPosition,
          orgUnit: profile.EvOrgUnit,
          address: profile.EvAddress,
        },
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Profile request failed" });
  }
});

// ------------------ LEAVE ROUTE ------------------
app.post("/api/employee/leave", async (req, res) => {
  const { employeeId } = req.body;
  const soapBody = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                 xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
    <soap:Header/>
    <soap:Body>
      <n0:ZgrhEmpLeaveFm xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
        <EmployeeId>${employeeId}</EmployeeId>
      </n0:ZgrhEmpLeaveFm>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const { data } = await axios.post(process.env.SAP_EMP_LEAVE_URL, soapBody, {
      headers: {
        "Content-Type": "application/soap+xml",
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
    });

    xml2js.parseString(data, { explicitArray: false }, (err, result) => {
      if (err) return res.status(500).json({ error: "Parse error" });

      let items =
        result["env:Envelope"]["env:Body"]["n0:ZgrhEmpLeaveFmResponse"]["LeaveDetails"]["item"];
      if (!Array.isArray(items)) items = [items];

      const formattedLeaves = items.map((entry) => ({
        empId: entry.EmpId,
        startDate: entry.StartDate,
        endDate: entry.EndDate,
        abType: entry.AbType,
        abDays: entry.AbDays,
        reason: entry.Reason,
        quotaNumber: entry.QuotaNumber,
        startDateQuota: entry.StartDateQuota,
        endDateQuota: entry.EndDateQuota,
      }));

      res.json({ status: "X", message: "Leave fetched", leaves: formattedLeaves });
    });
  } catch (error) {
    res.status(500).json({ error: "Leave request failed" });
  }
});

// ------------------ PAYSLIP ROUTE ------------------
app.post("/api/employee/pay", async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  const soapBody = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                 xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
    <soap:Header/>
    <soap:Body>
      <n0:ZgrhEmpPayFm xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
        <EmployeeId>${employeeId}</EmployeeId>
      </n0:ZgrhEmpPayFm>
    </soap:Body>
  </soap:Envelope>`;

  try {
    const { data } = await axios.post(process.env.SAP_EMP_PAYSLIP_URL, soapBody, {
      headers: {
        "Content-Type": "application/soap+xml",
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
    });

    xml2js.parseString(data, { explicitArray: false }, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Failed to parse SOAP response" });
      }

      const payslipItems =
        result?.["env:Envelope"]?.["env:Body"]?.["n0:ZgrhEmpPayFmResponse"]?.["PayslipDetails"]?.["item"];

      const payslips = Array.isArray(payslipItems) ? payslipItems : [payslipItems];

      if (!payslipItems) {
        return res.status(404).json({ message: "No payslip records found" });
      }

      res.status(200).json({
        status: "X",
        message: "Payslip data fetched successfully",
        payslips,
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Pay request failed" });
  }
});

// ------------------ PAYSLIP PDF DOWNLOAD ------------------
app.post("/api/employee/payslip/pdf", async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  const soapEnvelope = `
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
                   xmlns:urn="urn:sap-com:document:sap:soap:functions:mc-style">
      <soap:Header/>
      <soap:Body>
        <n0:ZgrhEmpPaypdfFm xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
          <EmployeeId>${employeeId}</EmployeeId>
        </n0:ZgrhEmpPaypdfFm>
      </soap:Body>
    </soap:Envelope>
  `;

  try {
    const { data } = await axios.post(process.env.SAP_EMP_PAYSLIP_PDF_URL, soapEnvelope, {
      headers: {
        "Content-Type": "application/soap+xml;charset=UTF-8",
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: "text",
    });

    const result = await xml2js.parseStringPromise(data, { explicitArray: false });

    const base64PDF =
      result?.["env:Envelope"]?.["env:Body"]?.["n0:ZgrhEmpPaypdfFmResponse"]?.["PayslipPdf"];

    if (!base64PDF || typeof base64PDF !== "string") {
      return res.status(500).json({ error: "Invalid PDF base64 in SAP response" });
    }

    const pdfBuffer = Buffer.from(base64PDF, "base64");

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="payslip_${employeeId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to download payslip PDF" });
  }
});

// ------------------ SERVER INIT ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
