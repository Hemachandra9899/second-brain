import React from 'react';

export const Registerpage=()=>{
    const hangeregister =()=>{

    }
    return(
        <div>
            <h1>Registerpage</h1>
            <form>
                <input type="text" value  placeholder="Enter your name" />
                <input type="email" placeholder="Enter your email" />
                <input type="password" placeholder="Enter your password" />
                <button onClick={hangeregister}>Register</button>
            </form>
        </div>
    )
}