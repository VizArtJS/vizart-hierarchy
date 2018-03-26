import { apiUpdate as apiUpdateSVG } from 'vizart-core';


const apiUpdate = state => ({
    update() {
        apiUpdateSVG(state).update();

        const { _data, _color } = state;

        if (_data) {
            _color.domain( _data.map(d => d.name) );
        }
    }
})

export default apiUpdate