import React, { useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import { useAnalytics } from 'use-analytics';
import logo from './logo.svg';
import './Application.css';

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

    }, [])


    return (
        <div className="App">
            <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
                web3 ceramic-analytics proof of concept
                <br />
                <span style={{ fontSize: 10, color: 'gray' }}>
                    { !DID? 'No authenticated DID':
                        `Your authenticated DID is ${ DID }`
                    }
                </span>
            </p>
            <div>
                <button onClick={() => track('trackThing')}>
                    Track event
                </button>
                <button onClick={() => page()}>
                    Trigger page view
                </button>
                <button onClick={() => identify('userID', { email: 'bob@bob.com' })}>
                    Trigger identify visitor
                </button>
            </div>
            </header>
            <Toaster />
        </div>        
    );  
}
export default Application;