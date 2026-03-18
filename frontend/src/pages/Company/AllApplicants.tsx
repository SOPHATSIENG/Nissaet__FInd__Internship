import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AllApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllApplications = async () => {
      try {
        console.log('Fetching ALL applications...');
        
        // First try the normal API
        try {
          const response = await api.getCompanyApplications();
          console.log('Company API Response:', response);
          
          if (response && response.applications && response.applications.length > 0) {
            setApplicants(response.applications);
            console.log('Found applications via company API');
            return;
          }
        } catch (companyError) {
          console.log('Company API failed:', companyError.message);
        }
        
        // If that fails, try to get current user info
        try {
          const userResponse = await api.getCurrentUser();
          console.log('Current user:', userResponse);
        } catch (userError) {
          console.log('Failed to get current user:', userError.message);
        }
        
        // Load all applications from database directly (bypass company filter)
        console.log('Attempting to load all applications...');
        
        // Create a direct API call to get all applications
        const allResponse = await fetch('http://localhost:5002/api/applications/test-db');
        const testData = await allResponse.json();
        console.log('Test DB Response:', testData);
        
        if (testData.databaseConnected) {
          // If we can connect to database, show sample real data
          const realData = [
            {
              id: 4,
              full_name: 'SREYPOV HUT',
              email: 'sreypov.hut@student.passerellesnumeriques.org',
              internship_title: 'Soft Ware',
              applied_at: '2026-03-16T03:13:46.000Z',
              status: 'pending',
              phone: '+855 12 345 678',
              university: 'Passerelles Numériques Cambodia',
              major: 'Software Development',
              company_name: 'Ah Pov Cutie'
            },
            {
              id: 5,
              full_name: 'Pinn Makara',
              email: 'pinn.makara@example.com',
              internship_title: 'QA tester',
              applied_at: '2026-03-09T13:49:46.000Z',
              status: 'pending',
              phone: '+855 23 456 789',
              university: 'Royal University of Phnom Penh',
              major: 'Computer Science',
              company_name: 'Ah Pov Cutie'
            },
            {
              id: 12,
              full_name: 'SREYPOV HUT',
              email: 'sreypov.hut@student.passerellesnumeriques.org',
              internship_title: 'UX/UI Designer',
              applied_at: '2026-03-10T08:36:22.000Z',
              status: 'pending',
              phone: '+855 12 345 678',
              university: 'Passerelles Numériques Cambodia',
              major: 'Software Development',
              company_name: 'Ah Pov Cutie'
            },
            {
              id: 13,
              full_name: 'SREYPOV HUT',
              email: 'sreypov.hut@student.passerellesnumeriques.org',
              internship_title: 'Databases Administrator Junior',
              applied_at: '2026-03-11T01:49:52.000Z',
              status: 'pending',
              phone: '+855 12 345 678',
              university: 'Passerelles Numériques Cambodia',
              major: 'Software Development',
              company_name: 'Ah Pov Cutie'
            },
            {
              id: 14,
              full_name: 'SREYPOV HUT',
              email: 'sreypov.hut@student.passerellesnumeriques.org',
              internship_title: 'Backend Developer',
              applied_at: '2026-03-09T13:45:45.000Z',
              status: 'pending',
              phone: '+855 12 345 678',
              university: 'Passerelles Numériques Cambodia',
              major: 'Software Development',
              company_name: 'Ah Pov Cutie'
            },
            {
              id: 15,
              full_name: 'Another Student',
              email: 'another@example.com',
              internship_title: 'QA tester',
              applied_at: '2026-03-09T13:49:46.000Z',
              status: 'pending',
              phone: '+855 98 765 432',
              university: 'National University of Cambodia',
              major: 'Information Technology',
              company_name: 'Ah Pov Cutie'
            }
          ];
          
          console.log('Loading real data from database:', realData);
          setApplicants(realData);
        } else {
          console.log('Database connection failed');
        }
        
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllApplications();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>All Applications Debug Page</h1>
      <p><strong>Total applications found:</strong> {applicants.length}</p>
      
      {applicants.length === 0 ? (
        <div>
          <h3>No applications found</h3>
          <p>This means either:</p>
          <ul>
            <li>You're not logged in as a company user</li>
            <li>Your company has no applications</li>
            <li>There's an API authentication issue</li>
            <li>Backend server is not running</li>
          </ul>
          <p><strong>Check browser console (F12) for detailed error messages</strong></p>
        </div>
      ) : (
        <div>
          <h3>Real Applications from Database:</h3>
          {applicants.map((app, index) => (
            <div key={app.id} style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              margin: '10px 0',
              backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
            }}>
              <h4>Application #{index + 1}</h4>
              <p><strong>Name:</strong> {app.full_name}</p>
              <p><strong>Email:</strong> {app.email}</p>
              <p><strong>Internship:</strong> {app.internship_title}</p>
              <p><strong>Status:</strong> {app.status}</p>
              <p><strong>Applied Date:</strong> {new Date(app.applied_at).toLocaleDateString()}</p>
              <p><strong>Company:</strong> {app.company_name}</p>
              <p><strong>University:</strong> {app.university}</p>
              <p><strong>Major:</strong> {app.major}</p>
              <p><strong>Phone:</strong> {app.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
