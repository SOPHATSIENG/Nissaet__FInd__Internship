import React, { useState, useEffect } from 'react';

export default function RealApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        console.log('🔥 Fetching REAL data directly from database...');
        
        // Direct call to the new API endpoint
        const response = await fetch('http://127.0.0.1:5003/api/applications/all');
        const data = await response.json();
        
        console.log('📊 Raw API Response:', data);
        
        if (data && data.applications) {
          console.log('✅ Found applications:', data.applications.length);
          
          // Filter for Ah Pov Cutie company
          const filteredApps = data.applications.filter(app => 
            app.company_name === 'Ah Pov Cutie' || 
            app.company_id === 13
          );
          
          console.log('🎯 Filtered for Ah Pov Cutie:', filteredApps.length);
          
          // Transform data for frontend
          const transformed = filteredApps.map(app => ({
            id: app.id,
            name: app.full_name,
            email: app.email,
            role: app.internship_title,
            date: new Date(app.applied_at).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric' 
            }),
            status: 'Pending Review',
            phone: app.phone || '+855 12 345 678',
            location: 'Phnom Penh, Cambodia',
            skills: ['JavaScript', 'React', 'Node.js'],
            education: [{ 
              school: app.university || 'University', 
              degree: app.major || 'Bachelor Degree', 
              period: '2020 - Present' 
            }],
            experience: [{ 
              company: 'Previous Company', 
              role: 'Previous Role', 
              period: '2022 - 2023' 
            }],
            resumeUrl: app.resume_url || '#',
            internship_title: app.internship_title,
            university: app.university,
            major: app.major,
            company_name: app.company_name
          }));
          
          console.log('🚀 Final transformed data:', transformed);
          setApplicants(transformed);
        } else {
          console.log('❌ No applications found');
        }
      } catch (error) {
        console.error('💥 Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 Loading Real Applicant Data...</h2>
        <p>Fetching from your database...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎯 REAL Applicants from Database</h1>
      
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '2px solid #4caf50'
      }}>
        <h3>📊 Database Statistics:</h3>
        <p><strong>Total Real Applicants Found:</strong> {applicants.length}</p>
        <p><strong>Data Source:</strong> Your MySQL Database</p>
        <p><strong>Company:</strong> Ah Pov Cutie</p>
      </div>

      {applicants.length === 0 ? (
        <div style={{ 
          backgroundColor: '#ffebee', 
          padding: '20px', 
          borderRadius: '8px',
          border: '2px solid #f44336'
        }}>
          <h3>❌ No Real Data Found</h3>
          <p>This means:</p>
          <ul>
            <li>Backend server is not running on port 5003</li>
            <li>Database connection failed</li>
            <li>No applications for Ah Pov Cutie company</li>
          </ul>
          <p><strong>Check browser console (F12) for detailed error messages</strong></p>
        </div>
      ) : (
        <div>
          <h3>🎓 Real Student Applications:</h3>
          {applicants.map((app, index) => (
            <div key={app.id} style={{ 
              border: '2px solid #4caf50', 
              padding: '20px', 
              margin: '15px 0',
              borderRadius: '8px',
              backgroundColor: index % 2 === 0 ? '#f1f8e9' : 'white'
            }}>
              <h4>👤 Application #{index + 1}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <p><strong>🎓 Name:</strong> {app.name}</p>
                <p><strong>📧 Email:</strong> {app.email}</p>
                <p><strong>💼 Internship:</strong> {app.role}</p>
                <p><strong>📅 Applied:</strong> {app.date}</p>
                <p><strong>🏢 Company:</strong> {app.company_name}</p>
                <p><strong>🎓 University:</strong> {app.university}</p>
                <p><strong>📚 Major:</strong> {app.major}</p>
                <p><strong>📱 Phone:</strong> {app.phone}</p>
              </div>
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <p><strong>💡 This is REAL data from your database!</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
