import React, { useEffect, useState, useCallback } from 'react';
import { Card } from "react-bootstrap";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import { useNavigate } from "react-router-dom";

import { addDoc, 
        setDoc, 
        collection, 
        onSnapshot, 
        query, 
        orderBy, 
        doc, 
        deleteDoc,
        Timestamp } from 'firebase/firestore';
import db from "../database/firebase"

import "../style/Display.css" 


function Display() {


    // Database to Card ----------------------------------------------

    const [databaseArray, setDatabaseArray] = useState([])

    useEffect(() => {
        const q = query(collection(db, "Collection"), orderBy("date", "desc"));
        onSnapshot(q, (snapshot) => {
            const dt = snapshot.docs.map(doc => {
                return {
                    "id": doc.id,
                    "data":  doc.data()
                } // return {id:... , data: {...}}
            })
            setDatabaseArray(dt) // dt is a list of {id:... , data: {...}}
        });
    }, [])  

    




    // Add Project to Database ----------------------------------------------

    const [createShow, setCreateShow] = useState(false);
    const handleCreateClose = () => setCreateShow(false);
    const handleCreateShow = () => setCreateShow(true);

    const [data, setData] = useState({
        projectName: "Project 101",
        description: "This project does not have description",
        name: "nuclear guy",
        date: "",
        measureMode: "Manual", // String for Default Value
        dataCounts: [],
        dataVoltage: [],
        countsTime: "",
        progress: -1
    })

    function onCreateDataChange(event) {
        const { name, value } = event.target
        setData((prevData) => {
            return {
                ...prevData,
                [name]: value
            }
        })
    }
    
    const formSubmit = async (event) => {
        event.preventDefault()
        
        const timeStamp = Timestamp.fromDate(new Date());
        setData((prevData) => {
            prevData["date"] = timeStamp
            return prevData
        })
        
        const res = await addDoc(collection(db, "Collection"), data);
        console.log("Creating Project: id = ", res.id)
        setData({
            projectName: "Project 101",
            description: "This project does not have description",
            name: "nuclear guy",
            date: "",
            measureMode: "Manual", // String for Default Value
            dataCounts: [],
            dataVoltage: [],
            countsTime: "",
            progress: -1
        })
    }

    // Edit Project  ---------------------------------------------------------

    const [editShow, setEditShow] = useState(false)
    const handleEditClose = () => setEditShow(false)
    const handleEditShow = () => setEditShow(true)

    const [editId, setEditId] = useState("")

    const [editProjectName, setEditProjectName] = useState("") 
    const [editDescription, setEditDescription] = useState("")
    const [editName, setEditName] = useState("")
    const [editMeasureMode, setEditMeasureMode] = useState("")
    const [editDate, setEditDate] = useState("")

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

        await setDoc(doc(db, "Project", editId), {
            projectName: editProjectName,
            description: editDescription,
            name: editName,
            date: editDate,
            measureMode: editMeasureMode,
            dataCounts: data.dataCounts,
            dataVoltage: data.dataVoltage,
            countsTime: data.countsTime,
            progress: data.progress
        });
    }

    // Delete Project from Database ----------------------------------------------

    const [alertShow, setAlertShow] = useState(false);
    const handleAlertClose = () => setAlertShow(false);


    const handleAlertShow = () => setAlertShow(true);



    const [deleteId, setDeleteId] = useState("")

    // Display card of Project ----------------------------------------------

    const navigate = useNavigate();
    const navigateToProject = useCallback((cardId) => navigate("/"+cardId, { replace: false }), [navigate]);

    const renderCard = (card, index) => {
        const dateObj = new Date(card.data.date.seconds * 1000)
        const current = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`

        return (
            <Card style={{ width: "18rem"}} key={index} 
                className="card col-12 col-md-6 col-lg-3" >
                <Card.Body>
                    <Card.Title>{card.data.projectName}</Card.Title>
                    <Card.Text>{card.data.description}</Card.Text>
                </Card.Body>
                <ListGroup className="list-group-flush">
                    <ListGroup.Item><b>Name</b>  {card.data.name}</ListGroup.Item>
                    <ListGroup.Item><b>Date</b>  {current}</ListGroup.Item>
                    <ListGroup.Item><b>Type</b>  {card.data.measureMode}</ListGroup.Item>
                </ListGroup>
                <Card.Footer className="text-end">
                     <Button variant="primary" className="m-1" onClick={() => {       
                        navigateToProject(card.id)
                    }}>
                        {"Inspect"}
                    </Button>
                    
                    <Button variant="warning" className="m-1" onClick={() => {
                        setEditId(card.id)
                        setEditProjectName(card.data.projectName)
                        setEditDescription(card.data.description)
                        setEditName(card.data.name)
                        setEditMeasureMode(card.data.measureMode)
                        setEditDate(card.data.date)
                        handleEditShow()
                    }}>
                        <i className="fa-regular fa-pen-to-square"></i>
                    </Button>
                    <Button variant="danger" className="m-1" onClick={() => {       
                        setDeleteId(card.id)
                        handleAlertShow()
                    }}>
                        <i className="fa-regular fa-trash-can"></i>
                    </Button>
                </Card.Footer>
            </Card>
        )
    }


    return (
        <>

        <section className="main-content">
            <br></br>
            <br></br>
            <h1 className='title'>SCA Dashboard</h1>
            <br></br>
            <br></br>
            <div className='container'>
                <div className='activity'>  
                    {databaseArray.map(renderCard)}
                    <div className='footer'>
                        <div>
                            <Button variant="primary" className="NewProjectButton" onClick={handleCreateShow}>
                                <p><i class="fa-solid fa-plus"></i></p>
                            </Button>
                        </div>
                    </div>  
                </div> 
            </div>   
        </section>


















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
                                <option>{editMeasureMode}</option>
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




















            <Modal show={alertShow} onHide={handleAlertClose}>
                <Modal.Header>
                    <Modal.Title>Deleting Project ?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p>
                    When clicking on the "Delete" button, 
                    the system will remove this project from the database permanently. 
                    It means that data in project cannot be restored.
                </p>    
                <p>
                    Press "Cancel" button to cancel.
                </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleAlertClose}>
                        Cancel
                    </Button> 
                    <Button variant="danger" onClick={() => {
                         const deleteProject = async () => {
                             await deleteDoc(doc(db, "Project", deleteId));    
                         }  
                        deleteProject()
                        handleAlertClose()
                        console.log("Deleting Project: id = ",deleteId)
                    }}>
                        Delete
                    </Button>     
                </Modal.Footer>
            </Modal>
















            <Modal show={createShow} onHide={handleCreateClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={formSubmit} id="create-project">
                        
                        <Form.Group className="mb-3" controlId="formProjectName">
                            <Form.Label>Project Name</Form.Label>
                            <Form.Control 
                                name="projectName" 
                                placeholder="project name" 
                                onChange={onCreateDataChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control 
                                as="textarea" rows={3}
                                name="description" 
                                placeholder="description" 
                                onChange={onCreateDataChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control 
                                name="name" 
                                placeholder="name" 
                                onChange={onCreateDataChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formMeasureMode">
                            <Form.Label>Measurement Mode</Form.Label>
                            <Form.Select    
                                name="measureMode" 
                                onChange={onCreateDataChange}
                                aria-label="Default select example"
                            >
                                <option>Manual</option>
                                <option>Integral</option>
                                <option>Auto Scan</option>
                            </Form.Select>
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleCreateClose} type="submit" form="create-project" value="Submit">Create Project</Button>     
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default Display;
