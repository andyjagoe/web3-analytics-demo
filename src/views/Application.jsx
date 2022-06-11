import React, { useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import { useAnalytics } from 'use-analytics';
import logo from './logo.svg';
import './Application.css';
import toast from 'react-hot-toast';


const Application = () => {
    const { track, page, identify } = useAnalytics();

    const [hasAddedStorageListener, setHasAddedStorageListener] = useState(false);
    const [DID, setDID] = useState();


    useEffect(() => {
        if (!hasAddedStorageListener) {
            window.addEventListener('storage', function(e) {
                //console.log(e);
                const did = localStorage.getItem('authenticatedDID');
                setDID(did);
            });                
            setHasAddedStorageListener(true);
        }
        
        setDID(localStorage.getItem('authenticatedDID'));

    }, [hasAddedStorageListener])


    return (
        <div className="App">
            <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
                decentralized web3 analytics demo app
                <br />
                <span style={{ fontSize: 10, color: 'gray' }}>
                    { !DID? 'No authenticated DID':
                        `Your authenticated DID is ${ DID }`
                    }
                </span>
            </p>
            <div>
                <button onClick={() => {
                    track('trackThing');
                    toast(`Event tracked. See console.log for details.`, {icon: '🚀',});
                }}>
                    Track event
                </button>
                <button onClick={() => {
                    page();
                    toast(`Page view tracked. See console.log for details.`, {icon: '👀',});
                }}>
                    Trigger page view
                </button>
                <button onClick={() => {
                    identify('userID', { email: 'bob@bob.com' });
                    toast(`Identify tracked. See console.log for details.`, {icon: '👩‍🌾',});
                }}>
                    Trigger identify visitor
                </button>
            </div>
            </header>
            <Toaster />
        </div>        
    );  
}
export default Application;