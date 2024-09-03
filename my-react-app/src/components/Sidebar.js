import 'bootstrap-icons/font/bootstrap-icons.css';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './style.css';

function Sidebar() {
    const [active, setActive] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className='sidebar d-flex justify-content-between flex-column py-3 ps-3 pe-5 vh-100 bg-dark'>
            <div>
                <a href="" className='p-3 text-decoration-none text-white'>
                    <i className='bi-door-open fs-4 me-4'></i>
                    <span className='fs-3 text-white'>LectureCheck</span>

                </a>
                <hr className=' text-white mt-2 ' />
                <ul className='nav nav-pills flex-column mt-2'>
                    <li className={active === 1 ? 'active nav-item p-2' : "nav-item p-2"}
                        onClick={e => {setActive(1);toggleSidebar(); }}>
                        <NavLink to="/" className='p-1 text-white text-decoration-none'>
                            <i className='bi bi-speedometer2 me-3 fs-5'></i>
                            <span className='fs-4 text-white'>Dashboard</span>
                        </NavLink>
                    </li>


                

                    <li className={active === 3 ? 'active nav-item p-2' : "nav-item p-2"}
                        onClick={e => {setActive(3);toggleSidebar();}}>
                        <NavLink to="/uploadvd" className='p-1 text-white text-decoration-none'>
                            <i className='bi-cloud-upload-fill me-3 fs-4'></i>
                            <span className='fs-4 text-white'>Uploads</span>
                        </NavLink>
                    </li>
                    {/* <li className={active === 4 ? 'active nav-item p-2' : "nav-item p-2"}
                        onClick={e => {setActive(4);toggleSidebar();}}>
                        < NavLink to="/report" className='p-1 text-white text-decoration-none'>
                            <i className='bi-graph-up me-3 fs-4'></i>
                            <span className='fs-4 text-white'>Match Report</span>
                        </NavLink>
                    </li> */}
                    {/* <li className={active === 5 ? 'active nav-item p-2' : "nav-item p-2"}
                        onClick={e => {setActive(5);toggleSidebar();}}>
                        <NavLink to="/feedback" className='p-1 text-white text-decoration-none'>
                            <i className='bi-chat-dots me-3 fs-4'></i>
                            <span className='fs-4 text-white'>Feedback</span>
                        </NavLink>
                    </li> */}
                </ul>

            </div>
            <div>
                <hr className='text-white' />
                <div className='nav-item p-2 text-white'>
                    <a className='p-1 text-decoration-none text-white'>
                        <i className='bi bi-person-circle me-3 fs-4'></i>
                        <span className='fs-4 text-white'>YourSelf</span>
                    </a>

                </div>
            </div>
        </div>
    )
}
export default Sidebar
