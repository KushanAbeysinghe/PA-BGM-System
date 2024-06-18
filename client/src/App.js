import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import RadioPlayer from './components/RadioPlayer';
import CustomTrackForm from './components/CustomTrackForm';
import TrackList from './components/TrackList';
import TrackManager from './components/TrackManager';
import './App.css';

function App() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>Online Radio Streaming</h1>
          <RadioPlayer />
          <CustomTrackForm />
          <TrackList />
          <TrackManager />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
