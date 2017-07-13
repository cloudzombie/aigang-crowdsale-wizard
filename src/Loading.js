import React, { Component } from 'react';
import {PulseLoader} from 'halogen';
const Loader = PulseLoader;

export default class Loading extends Component {
    constructor(props) {
        super(props)
        this.state = {
            percent: 25
        }
        this.increase = this.increase.bind(this);
    }
    componentDidMount() {
        this.increase();
    }
    componentWillUnmount() {
        clearTimeout(this.tm);
    }

    increase() {
        const percent = this.state.percent + 1;
        if (percent >= 100) {
            clearTimeout(this.tm);
            return;
        }
        this.setState({ percent });
        this.tm = setTimeout(this.increase, 10);
    }

    render() {
        return (
            <div className="pure-g" style={{alignItems: 'center', height: '100%'}}>
                <div className="pure-u-1" style={{ textAlign: 'center'}}>
                    Loading web3 ...
                 <Loader color="#7c24ad" size="50px" margin="4px"/>
                </div>
            </div>
        )
    }
}
