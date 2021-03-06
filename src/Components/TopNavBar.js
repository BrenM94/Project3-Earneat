import React, { Component } from 'react';
import { Menu, Button} from 'semantic-ui-react';

export default class TopNavBar extends Component {
    onLogOut = () => fetch('/api/logout', {method: "POST"})
        .then(res => {
            if (res.status === 200) window.location.href = '/';
        })
    
    render() {
        return (
            <Menu inverted color="teal" fluid horizontal="true" attached="top" borderless={true}
                className="topNavBar"
            >
                    <Menu.Item as='h3' header name='EarnEat' 
                        style={{'margin-left':'5%', 'font-weight': 'bold'}}
                    />
                    <Menu.Item position='right'> 
                        <Button circular={true} type='submit' inverted
                            onClick={this.onLogOut}> 
                            Log Out
                        </Button>
                    </Menu.Item>             
            </Menu>
        )
    }
}
