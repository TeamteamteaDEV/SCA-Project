import React, { useEffect, useState } from 'react';
import { Card, InputGroup } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Form  from 'react-bootstrap/Form';
import { useParams } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { setDoc, doc, onSnapshot } from 'firebase/firestore';
import db from "../database/firebase"

import "../style/Task.css" ;

import { Label, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ReactExport from "react-data-export";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const Task = () => {

    const { projectId } = useParams();

    const [projectData, setProjectData] = useState([])
    /*  projectData = [
            projectName: "Project 101",
            description: "",
            name: "",
            date: "",
            measureMode: "", 
            dataCounts: [],
            dataVoltage: [],
            countsTime: "",
            progress: ""
        ]
    */
    
    const [arrayJson, setArrayJson] = useState([])
    /*  arrayJson = [
            { voltage: 14, counts: 2435 },
            { voltage: 150, counts: 87365 },
            { voltage: 234, counts: 12 },
            ...
        ]
    */

    const [date, setDate] = useState()
    
    useEffect(() => {
        const docRef = doc(db, 'Collection', projectId);
        const getData = onSnapshot(docRef, (doc) => {
            setProjectData(doc.data());
            
            let dt = doc.data().dataVoltage.map((voltage, index) => ({
                voltage,
                counts: doc.data().dataCounts[index]
            }))
            setArrayJson(dt);

            const dateObj = new Date(doc.data().date.seconds * 1000)
            const current = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`
            setDate(current);

            clearTrueOfScaParameter()
        });

        return () => getData();
    }, [])  

    const clearTrueOfScaParameter = async () => {
        await setDoc(doc(db, "Collection", "Document"), {
            status: false,
            LLD: scaParameter.LLD < 0 ? "0" : scaParameter.LLD > 10 ? "10" : String(scaParameter.LLD),
            window: scaParameter.window < 0 ? "0" : scaParameter.window > 10 ? "10" : String(scaParameter.window),
            time: scaParameter.time < 0 ? "0" : scaParameter.time > 60 ? "60" : String(scaParameter.time),
            id: scaParameter.id,
            mode:scaParameter.mode
        })
    }

    const updateScaParameterToDatabase = async () => {
        await setDoc(doc(db, "Collection", "Document"), {
            status: scaParameter.status,
            LLD: scaParameter.LLD < 0 ? "0" : scaParameter.LLD > 10 ? "10" : String(scaParameter.LLD),
            window: scaParameter.window < 0 ? "0" : scaParameter.window > 10 ? "10" : String(scaParameter.window),
            time: scaParameter.time < 0 ? "0" : scaParameter.time > 60 ? "60" : String(scaParameter.time),
            id: scaParameter.id,
            mode: scaParameter.mode
        })
    }


    // Send Sca Parameter (LLD, Window, Time) to Backend ----------------------------------------------


    const [scaParameter, setScaParameter] = useState({
        status: false,
        LLD: 0,
        window: 10,
        time: 5,
        id: "",
        mode: ""
    })

    function onSumitParameterChange(event) {
        const { name, value } = event.target
        setScaParameter((prevData) => {
            return {
                ...prevData,
                [name]: value
            }
        })
    }

    const formSubmitSca = async (event) => {
        event.preventDefault()
        let step
        if (projectData.measureMode==="Auto Scan") {
            step = Math.ceil((10-scaParameter.LLD)/scaParameter.window)
        } else {
            step = 1
        }

        await setDoc(doc(db, "Collection", projectId), {
            projectName: projectData.projectName,
            description: projectData.description,
            name: projectData.name,
            date: projectData.date,
            measureMode: projectData.measureMode, 
            dataCounts: [],
            dataVoltage: [],
            countsTime: scaParameter.time,
            progress: step
        })
    }

    const doStartCounting = (tId) => {
        scaParameter["status"] = true
        scaParameter["id"] = tId
        scaParameter["mode"] = projectData.measureMode
        updateScaParameterToDatabase()
        console.log(scaParameter)
    }

    const doStartCountingIntegral = (tId) => {
        scaParameter["status"] = true
        scaParameter["id"] = tId
        scaParameter["window"] = 10
        scaParameter["mode"] = projectData.measureMode
        updateScaParameterToDatabase()
        console.log(scaParameter)
    }


    // Edit Project  ---------------------------------------------------------

    const [editShow, setEditShow] = useState(false)
    const handleEditClose = () => setEditShow(false)
    const handleEditShow = () => setEditShow(true)

    const [editProjectName, setEditProjectName] = useState("") 
    const [editDescription, setEditDescription] = useState("")
    const [editName, setEditName] = useState("")

    const onEditProjectNameChange = (event) => {
        event.preventDefault() // prevent the default action
        setEditProjectName(event.target.value)
    }

    const onEditDescriptionChange = (event) => {
        event.preventDefault() // prevent the default action
        setEditDescription(event.target.value);
    }

    const onEditNameChange = (event) => {
        event.preventDefault() // prevent the default action
        setEditName(event.target.value);
    }

    const editSubmit = async (event) => {
        event.preventDefault()

        await setDoc(doc(db, "Collection", projectId), {
            projectName: editProjectName,
            description: editDescription,
            name: editName,
            date: projectData.date,
            measureMode: projectData.measureMode,
            dataCounts: projectData.dataCounts,
            dataVoltage: projectData.dataVoltage,
            countsTime: projectData.countsTime,
            progress: projectData.progress
        });
    }

    // Display by Mode  ---------------------------------------------------------

    const displayByMode = (mode) => {
        if (mode==="Manual") {
            return(
                <>
                    <Card.Body className='inputZone text-end'>
                        <Form onSubmit={formSubmitSca} id="send-LLD-Window-Time">
                            
                            <InputGroup className="mb-3">
                                <InputGroup.Text>LLD</InputGroup.Text>
                                <Form.Control
                                    name="LLD" 
                                    placeholder="LLD (0 - 10 V)" 
                                    onChange={onSumitParameterChange}
                                />
                                <InputGroup.Text>ULD</InputGroup.Text>
                                <Form.Control
                                    name="window" 
                                    placeholder="ULD (0 - 10 V)"
                                    onChange={onSumitParameterChange} 
                                />
                                <InputGroup.Text>Time</InputGroup.Text>
                                <Form.Control
                                    name="time" 
                                    placeholder="Time/Step (0 - 60 sec)" 
                                    onChange={onSumitParameterChange}
                                />
                            </InputGroup>
                        </Form>

                        <Button variant="primary" className="startButton" onClick={() => {       
                            doStartCounting(projectId)
                        }} type="submit" form="send-LLD-Window-Time" value="Submit">
                            {"Start Counting"}
                        </Button>
                    </Card.Body>
                    <Card.Footer className='graphZone'>
                        {renderSingleData()}
                    </Card.Footer>
                </>
            )
        } else if (mode==="Integral") {
            return(
                <>
                    <Card.Body className='inputZone text-end'>
                        <Form onSubmit={formSubmitSca} id="send-LLD-Window-Time">
                            
                            <InputGroup className="mb-3">
                                <InputGroup.Text>LLD</InputGroup.Text>
                                <Form.Control
                                    name="LLD" 
                                    placeholder="LLD (0 - 10 V)" 
                                    onChange={onSumitParameterChange}
                                />
                                <InputGroup.Text>ULD</InputGroup.Text>
                                <Form.Control
                                    name="window" 
                                    placeholder="10 V" 
                                    disabled
                                />
                                <InputGroup.Text>Time</InputGroup.Text>
                                <Form.Control
                                    name="time" 
                                    placeholder="Time/Step (0 - 60 sec)" 
                                    onChange={onSumitParameterChange}
                                />
                            </InputGroup>
                        </Form>

                        <Button variant="primary" className="startButton" onClick={() => {       
                            doStartCountingIntegral(projectId)
                        }} type="submit" form="send-LLD-Window-Time" value="Submit">
                            {"Start Counting"}
                        </Button>
                    </Card.Body>
                    <Card.Footer className='graphZone'>
                        {renderSingleData()}
                    </Card.Footer>
                </>
                )            
        } else if (mode==="Auto Scan") {
            return(
                <>
                    <Card.Body className='inputZone text-end'>
                        <Form onSubmit={formSubmitSca} id="send-LLD-Window-Time">
                            
                            <InputGroup className="mb-3">
                                <InputGroup.Text>Stating Voltage</InputGroup.Text>
                                <Form.Control
                                    name="LLD" 
                                    placeholder="Voltage (0 - 10 V)" 
                                    onChange={onSumitParameterChange}
                                />
                                <InputGroup.Text>Window</InputGroup.Text>
                                <Form.Control
                                    name="window" 
                                    placeholder="Window (0 - 10 V)" 
                                    onChange={onSumitParameterChange}
                                />
                                <InputGroup.Text>Time</InputGroup.Text>
                                <Form.Control
                                    name="time" 
                                    placeholder="Time/Step (0 - 60 sec)" 
                                    onChange={onSumitParameterChange}
                                />
                            </InputGroup>
                        </Form>

                        <Button variant="primary" className="startButton" onClick={() => {       
                            doStartCounting(projectId)
                        }} type="submit" form="send-LLD-Window-Time" value="Submit">
                            {"Start Counting"}
                        </Button>
                    </Card.Body>
                    <Card.Footer className='graphZone'>
                        {renderAutoScanData()}
                    </Card.Footer>
                </>
            )
        }
    }

    
    const renderAutoScanData = () => {

        return(
            <>
                {checkInitProgressBar()}
                <div className='chart-display'>
                    <div className='chart-chart'>
                        <AreaChart width={800} height={400} data={arrayJson} margin={{ top: 75, right: 75, left: 75, bottom: 50}}>
                            <Area type="monotone" dataKey="counts" stroke="#8884d8" fill="#8884d8" />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                            <XAxis dataKey="voltage">
                                <Label value="LLD Voltage (V)" offset={10} position="bottom" />
                            </XAxis>
                            <YAxis>
                                <Label value={"Counts / " + projectData.countsTime + " s"} offset={10} position="left" angle={-90} textAnchor="start" />
                            </YAxis>
                            <Tooltip />
                        </AreaChart>
                    </div>
    
                    <div className='chart-button'>
                        <ExcelFile filename={projectData.projectName + " SCA Spectrum"} element={<Button variant="primary">Download Data</Button>}>
                            <ExcelSheet data={arrayJson} name="SCA Spectrum">
                                <ExcelColumn label="LLD Voltage (V)" value="voltage"/>
                                <ExcelColumn label={"Counts / " + projectData.countsTime + " s"} value="counts"/>
                            </ExcelSheet>
                        </ExcelFile>
                    </div>
                </div>
            </>
        )
    }

    const renderSingleData = () => {
        return(
            <>
            {checkInitProgressBar()}
            <div className='chart-display'>
                {checkEmpty()}
            </div>
            </>
        )
    }

    const checkEmpty = () => {
        if(arrayJson.length === 1) {
            return(
                <>
                    <div className='singleDisplay'>
                        {arrayJson[0]["counts"]} Counts / {projectData.countsTime} s
                    </div>
                    <div className='chart-button'>
                        <ExcelFile filename={projectData.projectName + " SCA Counts"} element={<Button variant="primary">Download Data</Button>}>
                            <ExcelSheet data={arrayJson} name="SCA Counts">
                                <ExcelColumn label="LLD Voltage (V)" value="voltage"/>
                                <ExcelColumn label={"Counts / " + projectData.countsTime + " s"} value="counts"/>
                            </ExcelSheet>
                        </ExcelFile>
                    </div>
                </>
            ) 
        } else {
            return(
                <div className='singleDisplay'>
                    0 Counts
                </div>                
            )    
        }
    }

    const checkInitProgressBar = () => {
        if (projectData.progress===-1) {
            return(
                <>
                </>
            )
        } else {
            const percent = arrayJson.length/projectData.progress * 100
            
            return(
                <>
                <div className='progressSection'>
                        <div>
                            Progress
                        </div>
                        <div>
                            <ProgressBar variant="success" animated now={percent} label={`${percent}%`} />
                        </div>                       
                </div>
                </>
            )
        }
    }








    return (
        <>

        <div className='Task'> 
            <div className='mca-display'>
                <div className='col-md-8'>
                    <Card>
                        <div className='operation row'>
                            <div className='col-8'>
                                <Card.Body>
                                    <Card.Title>{projectData.projectName}</Card.Title>
                                    <Card.Text>{date}</Card.Text>
                                    <Card.Text><b>Name</b> {projectData.name}</Card.Text>
                                    <Card.Text><b>Description</b> {projectData.description}</Card.Text>
                                    <Card.Text><b>Mode</b> {projectData.measureMode}</Card.Text>
                                </Card.Body>
                            </div>
                            <div className='mca-button col-4 text-end'>
                                <Button variant="warning" className="m-1" onClick={() => {
                                    setEditProjectName(projectData.projectName)
                                    setEditDescription(projectData.description)
                                    setEditName(projectData.name)
                                    handleEditShow()
                                }}>
                                    <i className="fa-regular fa-pen-to-square"></i>
                                </Button>
                            </div>
                        </div>

                        {displayByMode(projectData.measureMode)}

                    </Card>
                </div>  
            </div>
        </div>



        <Modal show={editShow} onHide={handleEditClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={editSubmit} id="edit-project">
                                              
                        <Form.Group className="mb-3" controlId="formProjectName">
                            <Form.Label>Project Name</Form.Label>
                            <Form.Control 
                                name="projectName" 
                                value={editProjectName}
                                placeholder="edit project name" 
                                onChange={onEditProjectNameChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control 
                                as="textarea" rows={3}
                                name="description" 
                                value={editDescription}
                                placeholder="edit description" 
                                onChange={onEditDescriptionChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control 
                                name="name" 
                                value={editName}
                                placeholder="edit name"
                                onChange={onEditNameChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formMeasureMode">
                            <Form.Label>Measurement Mode</Form.Label>
                            <Form.Select    
                                name="measureMode" 
                                disabled
                            >
                                <option>{projectData.measureMode}</option>
                            </Form.Select>
                        </Form.Group>


                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleEditClose}>
                        Cancel
                    </Button> 
                    <Button variant="warning" onClick={handleEditClose} type="submit" form="edit-project" value="Submit">Edit Project</Button>     
                </Modal.Footer>
            </Modal>





        </>
    )
}

export default Task;